import os
import sys
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Query, Session
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.database import get_db
from app.models.company import Company
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.schemas.offer import (
    OfferCreate,
    OfferUpdate,
    OfferResponse,
    OfferPublicResponse,
    OfferApprovalAction,
    OfferSignRequest,
    OfferDeclineRequest,
    OfferTemplateCreate,
    OfferTemplateResponse,
)
from app.crud.offer import create_offer, create_offer_approval
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_scoped_offers_query,
    get_offer_or_403,
    get_application_or_403
)
from app.utils.offer_crypto import generate_secure_offer_token, compute_offer_audit_hash

router = APIRouter(prefix="/offers", tags=["Offers"])


# ─────────────────────────────────────────────────────────────
# 1. OFFER TEMPLATES
# ─────────────────────────────────────────────────────────────
@router.get("/templates", response_model=List[OfferTemplateResponse])
def get_offer_templates(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    templates = db.query(OfferTemplate).filter(OfferTemplate.is_active).all()
    return templates


@router.post(
    "/templates",
    response_model=OfferTemplateResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def create_offer_template(
    payload: OfferTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    template = OfferTemplate(
        company_id=current_user.get("company_id"),
        title=payload.title,
        department=payload.department or "GLOBAL",
        content=payload.content,
        created_by=current_user["user_id"]
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.put(
    "/templates/{template_id}",
    response_model=OfferTemplateResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def update_offer_template(
    template_id: int,
    payload: OfferTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    template = db.query(OfferTemplate).filter(OfferTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Offer template not found")

    template.title = payload.title
    template.department = payload.department or "GLOBAL"
    template.content = payload.content
    template.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(template)
    return template


# ─────────────────────────────────────────────────────────────
# 2. CANONICAL REST OFFER & APPROVAL RESOURCE ENDPOINTS
# ─────────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def create_offer_endpoint(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    app = get_application_or_403(payload.application_id, db=db, current_user=current_user)

    existing_offer = db.query(Offer).filter(Offer.application_id == payload.application_id).first()
    if existing_offer:
        offer = existing_offer.update_from_dict(payload.model_dump(exclude_unset=True))
        offer.updated_by = current_user["user_id"]
    else:
        offer = create_offer(db, payload, created_by=current_user["user_id"])

    # Update application status to offer_approval
    app.current_status = "offer_approval"
    app.disposition = "active"
    app.updated_by = current_user["user_id"]

    # Ensure an OfferApproval record is created in pending state
    approval = db.query(OfferApproval).filter(OfferApproval.offer_id == offer.id).first()
    if not approval:
        ceo = db.query(User).filter(User.role == "ceo", User.company_id == current_user.get("company_id")).first()
        approver_id = ceo.id if ceo else current_user["user_id"]
        approval = create_offer_approval(
            db,
            offer_id=offer.id,
            approver_id=approver_id,
            comments="Offer approval requested",
            created_by=current_user["user_id"]
        )

    db.commit()
    db.refresh(offer)

    return offer


@router.post(
    "/{offer_id}/approvals",
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
@router.post(
    "/{offer_id}/submit-approval",
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def create_offer_approval_request(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = get_offer_or_403(offer_id, db=db, current_user=current_user)
    if offer.application:
        offer.application.current_status = "offer_approval"
        offer.application.disposition = "active"
        offer.application.updated_by = current_user["user_id"]

    approval = db.query(OfferApproval).filter(OfferApproval.offer_id == offer.id).first()
    if not approval:
        ceo = db.query(User).filter(User.role == "ceo", User.company_id == current_user.get("company_id")).first()
        approver_id = ceo.id if ceo else current_user["user_id"]
        approval = create_offer_approval(
            db,
            offer_id=offer.id,
            approver_id=approver_id,
            comments="Offer approval requested",
            created_by=current_user["user_id"]
        )

    db.commit()
    return {"message": "Offer approval submitted successfully"}


@router.get("", response_model=List[OfferResponse],
    dependencies=[Depends(require_permissions(["offer:view"]))]
)
def list_offers(
    db: Session = Depends(get_db),
    offers_query: Query = Depends(get_scoped_offers_query),
):
    offers = offers_query.order_by(Offer.created_at.desc()).all()
    results = []
    for offer in offers:
        resp = OfferResponse.model_validate(offer)
        if offer.signed_at:
            resp.status = "SIGNED"
        elif offer.decline_reason:
            resp.status = "DECLINED"
        elif offer.secure_token or (offer.application and offer.application.current_status == "offer_sent"):
            resp.status = "SENT"
        elif offer.application and offer.application.current_status == "offer_approval":
            resp.status = "PENDING_APPROVAL"
        else:
            resp.status = "DRAFT"
        results.append(resp)
    return results


@router.get("/{offer_id}", response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:view"]))]
)
def get_offer_detail(
    offer: Offer = Depends(get_offer_or_403)
):
    return offer


@router.put(
    "/{offer_id}",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def update_offer(
    payload: OfferUpdate,
    offer: Offer = Depends(get_offer_or_403),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer.update_from_dict(payload.model_dump(exclude_unset=True))
    offer.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(offer)
    return offer


# ──── Executive Decision (Approve / Reject) ────
@router.post(
    "/{offer_id}/approvals/decision",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:approve"]))]
)
@router.post(
    "/{offer_id}/approval",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:approve"]))]
)
async def record_offer_approval_decision(
    action_payload: OfferApprovalAction,
    offer: Offer = Depends(get_offer_or_403),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # 1. Record Executive Approval
    approval = db.query(OfferApproval).filter(OfferApproval.offer_id == offer.id).first()
    if not approval:
        approval = create_offer_approval(
            db,
            offer_id=offer.id,
            approver_id=current_user["user_id"],
            comments=action_payload.comments,
            created_by=current_user["user_id"]
        )
    else:
        approval.comments = action_payload.comments
        approval.approver_id = current_user["user_id"]
        approval.updated_by = current_user["user_id"]
        approval.decided_at = datetime.utcnow()

    action_upper = (action_payload.action or "APPROVE").upper()

    if "REJECT" in action_upper:
        if offer.application:
            offer.application.current_status = "rejected"
            offer.application.disposition = "rejected"
            offer.application.updated_by = current_user["user_id"]
    else:
        # 2. Auto-Generate Secure E-Signature Token
        token = generate_secure_offer_token()
        offer.secure_token = token
        offer.token_expires_at = datetime.utcnow() + timedelta(days=7)
        offer.updated_by = current_user["user_id"]

        if offer.application:
            offer.application.current_status = "offer_sent"
            offer.application.disposition = "active"
            offer.application.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(offer)

    return offer


# ──── Dispatch Offer to Candidate ────
@router.post(
    "/{offer_id}/dispatch",
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
@router.post(
    "/{offer_id}/send",
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def dispatch_offer_to_candidate(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = get_offer_or_403(offer_id, db=db, current_user=current_user)
    if not offer.secure_token:
        offer.secure_token = generate_secure_offer_token()
        offer.token_expires_at = datetime.utcnow() + timedelta(days=7)

    if offer.application:
        offer.application.current_status = "offer_sent"
        offer.application.disposition = "active"

    db.commit()
    db.refresh(offer)
    return {"message": "Offer letter dispatched to candidate", "secure_token": offer.secure_token}


# ─────────────────────────────────────────────────────────────
# 3. PUBLIC CANDIDATE TOKEN ENDPOINTS (NO AUTH REQUIRED)
# ─────────────────────────────────────────────────────────────
@router.get("/public/{token}", response_model=OfferPublicResponse)
def get_public_offer(token: str, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.secure_token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired offer link")

    app = offer.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    now = datetime.utcnow()
    is_expired = bool(offer.token_expires_at and now > offer.token_expires_at)

    return OfferPublicResponse(
        id=offer.id,
        application_id=offer.application_id,
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        candidate_name=candidate.full_name if candidate else "Candidate",
        candidate_email=candidate.email if candidate else "",
        job_title=job.title if job else "Position",
        company_name=job.company.name if (job and job.company) else "AI Recruiter",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )


@router.post("/public/{token}/signatures", response_model=OfferPublicResponse)
@router.post("/public/{token}/sign", response_model=OfferPublicResponse)
def create_public_offer_signature(
    token: str,
    payload: OfferSignRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.secure_token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid offer link")

    if offer.signed_at:
        raise HTTPException(status_code=400, detail="This offer has already been signed")

    now = datetime.utcnow()
    if offer.token_expires_at and now > offer.token_expires_at:
        raise HTTPException(status_code=400, detail="This offer link has expired")

    app = offer.application
    candidate = app.candidate if app else None
    job = app.job if app else None
    client_ip = request.client.host if request.client else "127.0.0.1"

    audit_hash = compute_offer_audit_hash(
        offer_id=offer.id,
        candidate_email=candidate.email if candidate else "candidate@example.com",
        job_title=job.title if job else "Position",
        base_salary=offer.base_salary,
        start_date=str(offer.start_date),
        signer_name=payload.signer_name,
        signer_ip=client_ip,
        signed_at=now.isoformat(),
        signature_data=payload.signature_data
    )

    offer.signature_type = payload.signature_type
    offer.signature_data = payload.signature_data
    offer.signer_name = payload.signer_name
    offer.signer_ip = client_ip
    offer.signer_user_agent = request.headers.get("user-agent", "Unknown")
    offer.signed_at = now
    offer.audit_hash = audit_hash

    if app:
        app.current_status = "hired"
        app.disposition = "active"

    db.commit()
    db.refresh(offer)

    return OfferPublicResponse(
        id=offer.id,
        application_id=offer.application_id,
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        candidate_name=candidate.full_name if candidate else "Candidate",
        candidate_email=candidate.email if candidate else "",
        job_title=job.title if job else "Position",
        company_name=job.company.name if (job and job.company) else "AI Recruiter",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )


@router.post("/public/{token}/declinations", response_model=OfferPublicResponse)
@router.post("/public/{token}/decline", response_model=OfferPublicResponse)
def create_public_offer_declination(
    token: str,
    payload: OfferDeclineRequest,
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.secure_token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid offer link")

    now = datetime.utcnow()
    if offer.token_expires_at and now > offer.token_expires_at:
        raise HTTPException(status_code=400, detail="This offer link has expired")

    offer.decline_reason = payload.decline_reason
    if offer.application:
        offer.application.disposition = "rejected"

    db.commit()
    db.refresh(offer)

    app = offer.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    return OfferPublicResponse(
        id=offer.id,
        application_id=offer.application_id,
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        candidate_name=candidate.full_name if candidate else "Candidate",
        candidate_email=candidate.email if candidate else "",
        job_title=job.title if job else "Position",
        company_name=job.company.name if (job and job.company) else "AI Recruiter",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )
