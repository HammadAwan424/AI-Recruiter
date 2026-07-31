import os
import sys
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
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
    scoped_offers_query,
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
    dependencies=[Depends(require_permissions(["create_offer"]))]
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


# ─────────────────────────────────────────────────────────────
# 2. OFFER CRUD & UNIFIED APPROVAL WORKFLOW
# ─────────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["create_offer"]))]
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
    app.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(offer)

    return offer


@router.get("", response_model=List[OfferResponse])
def list_offers(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    offers = scoped_offers_query(db, current_user).order_by(Offer.created_at.desc()).all()
    return offers


@router.get("/{offer_id}", response_model=OfferResponse)
def get_offer_detail(
    offer: Offer = Depends(get_offer_or_403)
):
    return offer


@router.put(
    "/{offer_id}",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["create_offer"]))]
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


# ──── Unified Offer Approval & Dispatch (CEO Only) ────
@router.post(
    "/{offer_id}/approval",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["approve_requisition"]))]
)
async def handle_offer_approval(
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

    # 2. Auto-Generate Secure E-Signature Token
    token = generate_secure_offer_token()
    offer.secure_token = token
    offer.token_expires_at = datetime.utcnow() + timedelta(days=7)
    offer.updated_by = current_user["user_id"]

    if offer.application:
        offer.application.current_status = "offer_sent"
        offer.application.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(offer)

    # 3. Dispatch E-Signature Offer Link to Candidate Email via MCP
    app = offer.application
    candidate = app.candidate if app else None
    job = app.job if app else None
    ceo = db.query(User).filter(User.id == current_user["user_id"]).first()

    if candidate and job and ceo:
        try:
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            sign_link = f"{frontend_url}/offer/sign/{token}"
            today = datetime.now().strftime("%B %d, %Y")

            server_params = StdioServerParameters(
                command=sys.executable,
                args=[os.path.join(os.path.dirname(__file__), "..", "mcp_servers", "meeting_email_server.py")],
            )

            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    await session.call_tool(
                        "send_offer_letter",
                        {
                            "candidate_name": candidate.full_name,
                            "candidate_email": candidate.email,
                            "job_title": job.title,
                            "company_name": job.company.name if job.company else "Company",
                            "salary_range": f"${offer.base_salary:,.2f}" if offer.base_salary else (job.salary_range or "Competitive"),
                            "ceo_name": ceo.full_name,
                            "accept_link": sign_link,
                            "offer_date": today,
                            "sender_email": "nirmal.naik1994@gmail.com",
                            "sender_password": os.getenv("GMAIL_APP_PASSWORD", "")
                        }
                    )
        except Exception as e:
            print(f"MCP offer dispatch error: {e}")

    return offer


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
        company_name=job.company.name if (job and job.company) else "Agentra AI",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
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
        company_name=job.company.name if (job and job.company) else "Agentra AI",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
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
        company_name=job.company.name if (job and job.company) else "Agentra AI",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )
