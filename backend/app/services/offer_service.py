from datetime import datetime, timedelta
from typing import Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, Query

from app.models.offer import Offer, OfferApproval
from app.models.user import User
from app.domain.enums import ApplicationDisposition, ApplicationStatus, OfferStatus
from app.schemas.offer import (
    OfferCreate,
    OfferUpdate,
    OfferResponse,
)
from app.schemas.offer_approval import ExecutiveOfferDecision
from app.schemas.offer_public import (
    CandidateOfferDecision,
    DeclinedCandidateOfferDecision,
    OfferPublicResponse,
    SignedCandidateOfferDecision,
)
from app.crud.offer import (
    get_offer_by_token_db,
    create_offer_db,
    create_offer_approval_db,
)
from app.utils.security import get_offer_or_403, get_application_or_403
from app.utils.offer_crypto import generate_secure_offer_token, compute_offer_audit_hash
from app.services.gmail import (
    notify_executive_offer_approval,
    notify_candidate_offer_letter,
    notify_recruiter_offer_decision,
    notify_candidate_welcome_onboarding,
)


INTERNAL_OFFER_STATUSES = frozenset({
    OfferStatus.DRAFT,
    OfferStatus.PENDING_APPROVAL,
    OfferStatus.APPROVAL_REJECTED,
})


def ensure_offer_is_internal(offer: Offer) -> None:
    """Reject revisions that would alter an offer already visible to a candidate."""
    if offer.status not in INTERNAL_OFFER_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only draft, pending approval, or approval-rejected offers can be "
                "revised or deleted. Sent and finalized offers are immutable."
            ),
        )


def create_offer_service(
    db: Session,
    payload: OfferCreate,
    current_user: Dict[str, Any]
) -> OfferResponse:
    """Creates an offer, initializes pending approval via ORM relationships, and updates application stage."""
    app = get_application_or_403(payload.application_id, db=db, current_user=current_user)

    # Use ORM relationship app.offer directly (1-to-1 relationship)
    if app.offer:
        offer = app.offer.update_from_dict(payload.model_dump(exclude_unset=True))
        offer.updated_by = current_user["user_id"]
        offer.status = OfferStatus.PENDING_APPROVAL
    else:
        offer = create_offer_db(db, payload, created_by=current_user["user_id"])
        offer.status = OfferStatus.PENDING_APPROVAL

    app.current_status = ApplicationStatus.OFFER_APPROVAL
    app.disposition = ApplicationDisposition.ACTIVE
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
        if ceo and ceo.email:
            candidate_name = app.candidate.full_name if app.candidate else "Candidate"
            job_title = app.job.title if app.job else "Position"
            notify_executive_offer_approval(
                approver_email=ceo.email,
                candidate_name=candidate_name,
                job_title=job_title,
                base_salary=offer.base_salary,
                bonus_equity=offer.bonus_equity,
                start_date=str(offer.start_date) if offer.start_date else None
            )

    db.commit()
    db.refresh(offer)
    return offer_to_response(offer)


def offer_to_response(offer: Offer) -> OfferResponse:
    """Maps an Offer plus its application relationships to the HR response DTO."""
    response = OfferResponse.model_validate(offer)
    app = offer.application
    if app:
        response.candidate_id = app.candidate_id
        response.job_id = app.job_id
        response.job_title = app.job.title if app.job else None
        response.department = app.job.department if app.job else None
        response.candidate_name = app.candidate.full_name if app.candidate else None
    return response


def list_offers_service(db: Session, offers_query: Query) -> List[OfferResponse]:
    """Lists offers using the persisted offer lifecycle status."""
    offers = offers_query.order_by(Offer.created_at.desc()).all()
    return [offer_to_response(offer) for offer in offers]


def record_executive_decision_service(
    db: Session,
    offer_id: int,
    decision_payload: ExecutiveOfferDecision,
    current_user: Dict[str, Any]
) -> OfferResponse:
    """Processes executive sign-off (approved vs rejected) using ORM offer.approval relationship."""
    offer = get_offer_or_403(offer_id, db=db, current_user=current_user)
    if offer.status not in {OfferStatus.DRAFT, OfferStatus.PENDING_APPROVAL}:
        raise HTTPException(status_code=400, detail="This offer is no longer awaiting approval")
    comments = getattr(decision_payload, "comments", None)

    # Directly use ORM relationship offer.approval
    if not offer.approval:
        approval = create_offer_approval_db(
            db,
            offer_id=offer.id,
            approver_id=current_user["user_id"],
            comments=comments,
            created_by=current_user["user_id"]
        )
        approval.decided_at = datetime.utcnow()
    else:
        offer.approval.comments = comments
        offer.approval.approver_id = current_user["user_id"]
        offer.approval.updated_by = current_user["user_id"]
        offer.approval.decided_at = datetime.utcnow()

    app = offer.application
    candidate_name = app.candidate.full_name if app.candidate else "Candidate"
    candidate_email = app.candidate.email if app.candidate else ""
    job_title = app.job.title if app.job else "Position"
    company_name = app.job.company.name if (app.job and app.job.company) else "AI Recruiter"

    if decision_payload.decision == "rejected":
        offer.status = OfferStatus.APPROVAL_REJECTED
        offer.application.disposition = ApplicationDisposition.REJECTED
        offer.application.current_status = ApplicationStatus.OFFER_APPROVAL
        offer.application.updated_by = current_user["user_id"]

        creator = db.query(User).filter(User.id == offer.created_by).first()
        if creator and creator.email:
            notify_recruiter_offer_decision(
                recruiter_email=creator.email,
                candidate_name=candidate_name,
                job_title=job_title,
                decision="rejected",
                comments=comments
            )
    else:
        token = generate_secure_offer_token()
        offer.status = OfferStatus.SENT
        offer.secure_token = token
        offer.token_expires_at = datetime.utcnow() + timedelta(days=7)
        offer.updated_by = current_user["user_id"]

        offer.application.current_status = ApplicationStatus.OFFER_SENT
        offer.application.disposition = ApplicationDisposition.ACTIVE
        offer.application.updated_by = current_user["user_id"]

        if candidate_email:
            notify_candidate_offer_letter(
                candidate_email=candidate_email,
                candidate_name=candidate_name,
                job_title=job_title,
                company_name=company_name,
                secure_token=token,
                base_salary=offer.base_salary,
                start_date=str(offer.start_date) if offer.start_date else None
            )

    db.commit()
    db.refresh(offer)
    return offer_to_response(offer)


def get_public_offer_service(db: Session, token: str) -> OfferPublicResponse:
    """Retrieves public offer by secure token."""
    offer = get_offer_by_token_db(db, token)
    if not offer:
        raise HTTPException(status_code=404, detail="Invalid or expired offer link")
    if offer.token_expires_at and datetime.utcnow() > offer.token_expires_at:
        offer.status = OfferStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=404, detail="Invalid or expired offer link")
    if offer.status not in {
        OfferStatus.SENT,
        OfferStatus.SIGNED,
        OfferStatus.DECLINED,
    }:
        raise HTTPException(status_code=404, detail="Offer is not available to the candidate")

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
        status=offer.status,
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

    if offer.status != OfferStatus.SENT:
        raise HTTPException(status_code=400, detail="This offer is not awaiting a candidate decision")

    now = datetime.utcnow()
    if offer.token_expires_at and now > offer.token_expires_at:
        offer.status = OfferStatus.EXPIRED
        db.commit()
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
        offer.status = OfferStatus.SIGNED

        app.current_status = ApplicationStatus.HIRED
        app.disposition = ApplicationDisposition.ACTIVE

        candidate_name = app.candidate.full_name if app.candidate else "Candidate"
        candidate_email = app.candidate.email if app.candidate else ""
        job_title = app.job.title if app.job else "Position"
        company_name = app.job.company.name if (app.job and app.job.company) else "AI Recruiter"

        if candidate_email:
            notify_candidate_welcome_onboarding(
                candidate_email=candidate_email,
                candidate_name=candidate_name,
                job_title=job_title,
                company_name=company_name,
                start_date=str(offer.start_date) if offer.start_date else None,
                audit_hash=audit_hash
            )

    elif decision_payload.decision == "declined":
        declined_data: DeclinedCandidateOfferDecision = decision_payload
        offer.decline_reason = declined_data.decline_reason
        offer.status = OfferStatus.DECLINED
        app.disposition = ApplicationDisposition.REJECTED

        creator = db.query(User).filter(User.id == offer.created_by).first()
        if creator and creator.email:
            candidate_name = app.candidate.full_name if app.candidate else "Candidate"
            job_title = app.job.title if app.job else "Position"
            notify_recruiter_offer_decision(
                recruiter_email=creator.email,
                candidate_name=candidate_name,
                job_title=job_title,
                decision="declined",
                comments=declined_data.decline_reason
            )

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
        status=offer.status,
        signed_at=offer.signed_at,
        decline_reason=offer.decline_reason
    )


def delete_offer_service(db: Session, offer_id: int, current_user: Dict[str, Any]) -> Dict[str, str]:
    """Remove an offer and approval together, then return the application to interview."""
    offer = get_offer_or_403(offer_id, db=db, current_user=current_user)
    ensure_offer_is_internal(offer)
    app = offer.application

    app.current_status = ApplicationStatus.INTERVIEW
    app.disposition = ApplicationDisposition.ACTIVE
    app.updated_by = current_user["user_id"]

    # Do not rely solely on a database-level cascade: existing deployments may
    # have tables created before the FK cascade was introduced. Explicitly
    # deleting the dependent approval keeps the queue free of orphan records.
    if offer.approval:
        db.delete(offer.approval)
    db.delete(offer)
    db.commit()

    return {"message": f"Offer #{offer_id} and associated approval deleted successfully"}
