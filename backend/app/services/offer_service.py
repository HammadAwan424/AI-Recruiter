from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, Query

from app.models.offer import Offer, OfferApproval
from app.models.user import User
from app.schemas.offer import (
    OfferCreate,
    OfferUpdate,
    OfferResponse,
    OfferPublicResponse,
    ExecutiveOfferDecision,
    CandidateOfferDecision,
    SignedCandidateOfferDecision,
    DeclinedCandidateOfferDecision,
)
from app.crud.offer import (
    get_offer_by_token_db,
    create_offer_db,
    create_offer_approval_db,
)
from app.utils.security import get_offer_or_403, get_application_or_403
from app.utils.offer_crypto import generate_secure_offer_token, compute_offer_audit_hash


def create_offer_service(
    db: Session,
    payload: OfferCreate,
    current_user: Dict[str, Any]
) -> Offer:
    """Creates an offer, initializes pending approval via ORM relationships, and updates application stage."""
    app = get_application_or_403(payload.application_id, db=db, current_user=current_user)

    # Use ORM relationship app.offer directly (1-to-1 relationship)
    if app.offer:
        offer = app.offer.update_from_dict(payload.model_dump(exclude_unset=True))
        offer.updated_by = current_user["user_id"]
    else:
        offer = create_offer_db(db, payload, created_by=current_user["user_id"])

    app.current_status = "offer_approval"
    app.disposition = "active"
    app.updated_by = current_user["user_id"]

    # Use ORM relationship offer.approval directly (1-to-1 relationship)
    if not offer.approval:
        ceo = db.query(User).filter(User.role == "ceo", User.company_id == current_user.get("company_id")).first()
        approver_id = ceo.id if ceo else current_user["user_id"]
        create_offer_approval_db(
            db,
            offer_id=offer.id,
            approver_id=approver_id,
            comments="Offer approval requested",
            created_by=current_user["user_id"]
        )

    db.commit()
    db.refresh(offer)
    return offer


def list_offers_service(db: Session, offers_query: Query) -> List[OfferResponse]:
    """Lists offers and formats status metadata."""
    offers = offers_query.order_by(Offer.created_at.desc()).all()
    results = []
    for offer in offers:
        resp = OfferResponse.model_validate(offer)
        app = offer.application

        resp.job_id = app.job_id
        resp.candidate_id = app.candidate_id
        resp.job_title = app.job.title if app.job else "Position"
        resp.department = app.job.department if app.job else "GLOBAL"
        resp.candidate_name = app.candidate.full_name if app.candidate else "Candidate"

        if offer.signed_at:
            resp.status = "SIGNED"
        elif offer.decline_reason:
            resp.status = "DECLINED"
        elif offer.secure_token or app.current_status == "offer_sent":
            resp.status = "SENT"
        elif app.current_status == "offer_approval":
            resp.status = "PENDING_APPROVAL"
        else:
            resp.status = "DRAFT"
        results.append(resp)
    return results


def record_executive_decision_service(
    db: Session,
    offer_id: int,
    decision_payload: ExecutiveOfferDecision,
    current_user: Dict[str, Any]
) -> Offer:
    """Processes executive sign-off (approved vs rejected) using ORM offer.approval relationship."""
    offer = get_offer_or_403(offer_id, db=db, current_user=current_user)
    comments = getattr(decision_payload, "comments", None)

    # Directly use ORM relationship offer.approval
    if not offer.approval:
        create_offer_approval_db(
            db,
            offer_id=offer.id,
            approver_id=current_user["user_id"],
            comments=comments,
            created_by=current_user["user_id"]
        )
    else:
        offer.approval.comments = comments
        offer.approval.approver_id = current_user["user_id"]
        offer.approval.updated_by = current_user["user_id"]
        offer.approval.decided_at = datetime.utcnow()

    if decision_payload.decision == "rejected":
        offer.application.disposition = "rejected"
        offer.application.updated_by = current_user["user_id"]
    else:
        token = generate_secure_offer_token()
        offer.secure_token = token
        offer.token_expires_at = datetime.utcnow() + timedelta(days=7)
        offer.updated_by = current_user["user_id"]

        offer.application.current_status = "offer_sent"
        offer.application.disposition = "active"
        offer.application.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(offer)
    return offer


def get_public_offer_service(db: Session, token: str) -> OfferPublicResponse:
    """Retrieves public offer by secure token."""
    offer = get_offer_by_token_db(db, token)
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired offer link")

    app = offer.application

    return OfferPublicResponse(
        id=offer.id,
        application_id=offer.application_id,
        base_salary=offer.base_salary,
        bonus_equity=offer.bonus_equity,
        start_date=offer.start_date,
        expiry_date=offer.expiry_date,
        offer_letter_text=offer.offer_letter_text,
        candidate_name=app.candidate.full_name if app.candidate else "Candidate",
        candidate_email=app.candidate.email if app.candidate else "",
        job_title=app.job.title if app.job else "Position",
        company_name=app.job.company.name if (app.job and app.job.company) else "AI Recruiter",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )


def record_candidate_decision_service(
    db: Session,
    token: str,
    decision_payload: CandidateOfferDecision,
    client_ip: str,
    user_agent: str
) -> OfferPublicResponse:
    """Processes candidate public decision (signed vs declined)."""
    offer = get_offer_by_token_db(db, token)
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid offer link")

    now = datetime.utcnow()
    if offer.token_expires_at and now > offer.token_expires_at:
        raise HTTPException(status_code=400, detail="This offer link has expired")

    app = offer.application

    if decision_payload.decision == "signed":
        if offer.signed_at:
            raise HTTPException(status_code=400, detail="This offer has already been signed")

        signed_data: SignedCandidateOfferDecision = decision_payload

        audit_hash = compute_offer_audit_hash(
            offer_id=offer.id,
            candidate_email=app.candidate.email if app.candidate else "candidate@example.com",
            job_title=app.job.title if app.job else "Position",
            base_salary=offer.base_salary,
            start_date=str(offer.start_date),
            signer_name=signed_data.signer_name,
            signer_ip=client_ip,
            signed_at=now.isoformat(),
            signature_data=signed_data.signature_data
        )

        offer.signature_type = signed_data.signature_type
        offer.signature_data = signed_data.signature_data
        offer.signer_name = signed_data.signer_name
        offer.signer_ip = client_ip
        offer.signer_user_agent = user_agent
        offer.signed_at = now
        offer.audit_hash = audit_hash

        app.current_status = "hired"
        app.disposition = "active"

    elif decision_payload.decision == "declined":
        declined_data: DeclinedCandidateOfferDecision = decision_payload
        offer.decline_reason = declined_data.decline_reason
        app.disposition = "rejected"

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
        candidate_name=app.candidate.full_name if app.candidate else "Candidate",
        candidate_email=app.candidate.email if app.candidate else "",
        job_title=app.job.title if app.job else "Position",
        company_name=app.job.company.name if (app.job and app.job.company) else "AI Recruiter",
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )


def delete_offer_service(db: Session, offer_id: int, current_user: Dict[str, Any]) -> Dict[str, str]:
    """Deletes an offer and its associated approval record, reverting application status to 'interview'."""
    offer = get_offer_or_403(offer_id, db=db, current_user=current_user)
    app = offer.application

    app.current_status = "interview"
    app.updated_by = current_user["user_id"]

    db.delete(offer)
    db.commit()

    return {"message": f"Offer #{offer_id} and associated approval deleted successfully"}
