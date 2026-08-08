from fastapi import APIRouter, Depends, Request, Body
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.offer import OfferPublicResponse, CandidateOfferDecision
from app.services.offer_service import (
    get_public_offer_service,
    record_candidate_decision_service,
)

router = APIRouter(prefix="/public", tags=["Offers Public"])


@router.get("/{token}", response_model=OfferPublicResponse)
def get_public_offer(token: str, db: Session = Depends(get_db)):
    """Public endpoint to view offer letter details."""
    return get_public_offer_service(db, token)


@router.post("/{token}/decisions", response_model=OfferPublicResponse)
def record_candidate_offer_decision(
    token: str,
    request: Request,
    payload: CandidateOfferDecision = Body(..., discriminator="decision"),
    db: Session = Depends(get_db)
):
    """
    Public candidate decision endpoint.
    Accepts Discriminated Union CandidateOfferDecision (discriminator='decision'):
    1. decision='signed': Requires signer_name, signature_type (DRAWN|TYPED), signature_data
    2. decision='declined': Requires decline_reason
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown")
    return record_candidate_decision_service(
        db=db,
        token=token,
        decision_payload=payload,
        client_ip=client_ip,
        user_agent=user_agent
    )
