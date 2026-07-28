from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.database import get_db
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.models.recruitment import Candidate, Application, Job
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
from app.utils.security import get_current_user
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


@router.post("/templates", response_model=OfferTemplateResponse)
def create_offer_template(
    payload: OfferTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if current_user["role"] not in ["ceo", "superadmin", "hr"]:
        raise HTTPException(status_code=403, detail="Not authorized to create templates")

    template = OfferTemplate(
        title=payload.title,
        department=payload.department,
        content=payload.content
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


# ─────────────────────────────────────────────────────────────
# 2. OFFER CRUD & APPROVAL WORKFLOW
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=OfferResponse)
def create_offer(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Verify candidate & application exist
    candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    application = db.query(Application).filter(Application.id == payload.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check for existing offer for this application
    existing_offer = db.query(Offer).filter(Offer.application_id == payload.application_id).first()
    offer_data = payload.model_dump()
    offer_data["status"] = "PENDING_APPROVAL" if payload.submit_for_approval else "DRAFT"

    if existing_offer:
        if existing_offer.status in ["SIGNED", "SENT", "APPROVED"]:
            raise HTTPException(
                status_code=400,
                detail=f"An active offer with status '{existing_offer.status}' already exists for this application."
            )
        offer = existing_offer.update_from_dict(offer_data)
    else:
        offer_data["created_by_user_id"] = current_user["user_id"]
        offer = Offer.from_dict(offer_data)
        db.add(offer)

    # Determine assigned executive approver (CEO or SuperAdmin if available)
    ceo_user = db.query(User).filter(User.role == "ceo").first()
    target_approver_id = ceo_user.id if ceo_user else current_user["user_id"]

    # If submitted for approval immediately, create approval task atomically
    if payload.submit_for_approval:
        existing_approval = db.query(OfferApproval).filter(
            OfferApproval.offer_id == offer.id,
            OfferApproval.status == "PENDING"
        ).first()

        if not existing_approval:
            approval = OfferApproval(
                offer_id=offer.id,
                approver_id=target_approver_id,
                step_order=1,
                status="PENDING"
            )
            db.add(approval)

    # Single atomic transaction commit
    db.commit()
    db.refresh(offer)

    return offer


@router.get("", response_model=List[OfferResponse])
def list_offers(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offers = db.query(Offer).order_by(Offer.created_at.desc()).all()
    return offers


@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer_detail(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.put("/{offer_id}", response_model=OfferResponse)
def update_offer(
    offer_id: int,
    payload: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status not in ["DRAFT", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Only DRAFT or REJECTED offers can be updated")

    offer.update_from_dict(payload.model_dump(exclude_unset=True))

    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/submit-approval", response_model=OfferResponse)
def submit_offer_for_approval(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status not in ["DRAFT", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Offer is not in DRAFT or REJECTED state")

    offer.status = "PENDING_APPROVAL"

    # Find executive approver (CEO or SuperAdmin if available)
    ceo_user = db.query(User).filter(User.role == "ceo").first()
    target_approver_id = ceo_user.id if ceo_user else current_user["user_id"]

    # Create approval step if not exists
    existing_approval = db.query(OfferApproval).filter(
        OfferApproval.offer_id == offer.id,
        OfferApproval.status == "PENDING"
    ).first()

    if not existing_approval:
        approval = OfferApproval(
            offer_id=offer.id,
            approver_id=target_approver_id,
            step_order=1,
            status="PENDING"
        )
        db.add(approval)

    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/approval", response_model=OfferResponse)
def handle_offer_approval(
    offer_id: int,
    action_payload: OfferApprovalAction,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Authorization Check: Only CEO or SuperAdmin can approve/reject offers
    if current_user["role"] not in ["ceo", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="Only executive users (CEO / SuperAdmin) are authorized to approve or reject offer letters."
        )

    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    if offer.status != "PENDING_APPROVAL":
        raise HTTPException(status_code=400, detail="Offer is not pending approval")

    approval = db.query(OfferApproval).filter(
        OfferApproval.offer_id == offer.id,
        OfferApproval.status == "PENDING"
    ).first()

    now = datetime.utcnow()
    if approval:
        approval.status = "APPROVED" if action_payload.action == "APPROVE" else "REJECTED"
        approval.comments = action_payload.comments
        approval.decided_at = now

    if action_payload.action == "APPROVE":
        offer.status = "APPROVED"
    else:
        offer.status = "REJECTED"

    db.commit()
    db.refresh(offer)
    return offer


@router.post("/{offer_id}/send", response_model=OfferResponse)
def send_offer_to_candidate(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Authorization Check: Sending a DRAFT directly without prior approval requires CEO / SuperAdmin role
    if offer.status == "DRAFT" and current_user["role"] not in ["ceo", "superadmin"]:
        raise HTTPException(
            status_code=403,
            detail="DRAFT offers must be submitted for approval first before sending to candidate."
        )

    if offer.status not in ["APPROVED", "DRAFT"]:
        raise HTTPException(status_code=400, detail="Offer must be APPROVED or DRAFT to send")

    # Generate 7-day secure token
    token = generate_secure_offer_token()
    offer.secure_token = token
    offer.token_expires_at = datetime.utcnow() + timedelta(days=7)
    offer.status = "SENT"

    # Also update application status
    application = db.query(Application).filter(Application.id == offer.application_id).first()
    if application:
        application.status = "offer_sent"

    db.commit()
    db.refresh(offer)

    print(f"[OFFER SENT MOCK EMAIL] Token generated for candidate. Link: http://localhost:5173/offer/sign/{token}")
    return offer


@router.post("/{offer_id}/revoke", response_model=OfferResponse)
def revoke_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.status = "REVOKED"
    db.commit()
    db.refresh(offer)
    return offer


# ─────────────────────────────────────────────────────────────
# 3. PUBLIC CANDIDATE TOKEN ENDPOINTS (NO AUTH REQUIRED)
# ─────────────────────────────────────────────────────────────
@router.get("/public/{token}", response_model=OfferPublicResponse)
def get_public_offer(token: str, db: Session = Depends(get_db)):
    offer = db.query(Offer).filter(Offer.secure_token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired offer link")

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first() if offer.candidate_id else None
    job = db.query(Job).filter(Job.id == offer.job_id).first() if offer.job_id else None

    now = datetime.utcnow()
    is_expired = False
    if offer.token_expires_at and now > offer.token_expires_at:
        is_expired = True

    return OfferPublicResponse(
        secure_token=offer.secure_token or "",
        job_title=offer.job_title,
        department=offer.department,
        company_name=job.company_name if (job and job.company_name) else "AI Recruiter",
        candidate_name=candidate.full_name if candidate else "Candidate",
        candidate_email=candidate.email if candidate else "",
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        status=offer.status,
        signature_type=offer.signature_type,
        signature_data=offer.signature_data,
        signer_name=offer.signer_name,
        signed_at=offer.signed_at,
        audit_hash=offer.audit_hash,
        is_expired=is_expired
    )


@router.post("/public/{token}/sign", response_model=OfferPublicResponse)
def sign_public_offer(
    token: str,
    payload: OfferSignRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.secure_token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid offer link")

    if offer.status == "SIGNED":
        raise HTTPException(status_code=400, detail="This offer has already been signed")

    if offer.status in ["REVOKED", "DECLINED"]:
        raise HTTPException(status_code=400, detail="This offer is no longer valid")

    now = datetime.utcnow()
    if offer.token_expires_at and now > offer.token_expires_at:
        raise HTTPException(status_code=400, detail="This offer link has expired")

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first() if offer.candidate_id else None
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")

    candidate_email_str = candidate.email if (candidate and candidate.email) else "candidate@example.com"
    start_date_str = str(offer.start_date) if offer.start_date else ""

    # Compute Canonical SHA-256 Audit Hash
    audit_hash = compute_offer_audit_hash(
        offer_id=offer.id,
        candidate_email=candidate_email_str,
        job_title=offer.job_title,
        base_salary=offer.base_salary,
        start_date=start_date_str,
        signer_name=payload.signer_name,
        signer_ip=client_ip,
        signed_at=now.isoformat(),
        signature_data=payload.signature_data
    )

    # Save Signature & Audit Data
    offer.signature_type = payload.signature_type
    offer.signature_data = payload.signature_data
    offer.signer_name = payload.signer_name
    offer.signer_ip = client_ip
    offer.signer_user_agent = user_agent
    offer.signed_at = now
    offer.audit_hash = audit_hash
    offer.status = "SIGNED"

    # Update Candidate & Application status to hired
    application = db.query(Application).filter(Application.id == offer.application_id).first()
    if application:
        application.status = "hired"

    db.commit()
    db.refresh(offer)

    job = db.query(Job).filter(Job.id == offer.job_id).first() if offer.job_id else None

    return OfferPublicResponse(
        secure_token=offer.secure_token or "",
        job_title=offer.job_title,
        department=offer.department,
        company_name=job.company_name if (job and job.company_name) else "AI Recruiter",
        candidate_name=candidate.full_name if candidate else "Candidate",
        candidate_email=candidate_email_str,
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        status=offer.status,
        signature_type=offer.signature_type,
        signature_data=offer.signature_data,
        signer_name=offer.signer_name,
        signed_at=offer.signed_at,
        audit_hash=offer.audit_hash,
        is_expired=False
    )


@router.post("/public/{token}/decline", response_model=OfferPublicResponse)
def decline_public_offer(
    token: str,
    payload: OfferDeclineRequest,
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.secure_token == token).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid offer link")

    if offer.status == "SIGNED":
        raise HTTPException(status_code=400, detail="Cannot decline an already signed offer")

    if offer.status in ["REVOKED", "DECLINED"]:
        raise HTTPException(status_code=400, detail="This offer is no longer active")

    now = datetime.utcnow()
    if offer.token_expires_at and now > offer.token_expires_at:
        raise HTTPException(status_code=400, detail="This offer link has expired")

    offer.status = "DECLINED"
    offer.decline_reason = payload.decline_reason
    db.commit()
    db.refresh(offer)

    candidate = db.query(Candidate).filter(Candidate.id == offer.candidate_id).first() if offer.candidate_id else None
    job = db.query(Job).filter(Job.id == offer.job_id).first() if offer.job_id else None

    return OfferPublicResponse(
        secure_token=offer.secure_token or "",
        job_title=offer.job_title,
        department=offer.department,
        company_name=job.company_name if (job and job.company_name) else "AI Recruiter",
        candidate_name=candidate.full_name if candidate else "Candidate",
        candidate_email=candidate.email if candidate else "",
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        status=offer.status,
        signature_type=None,
        signature_data=None,
        signer_name=None,
        signed_at=None,
        audit_hash=None,
        is_expired=False
    )
