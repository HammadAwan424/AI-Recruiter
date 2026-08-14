from datetime import date, datetime
from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field

from app.domain.enums import OfferStatus, SignatureType


class SignedCandidateOfferDecision(BaseModel):
    decision: Literal["signed"] = "signed"
    signer_name: str = Field(min_length=1)
    signature_type: SignatureType = SignatureType.TYPED
    signature_data: str = Field(min_length=1)


class DeclinedCandidateOfferDecision(BaseModel):
    decision: Literal["declined"] = "declined"
    decline_reason: str = Field(min_length=1)


CandidateOfferDecision = Annotated[
    Union[SignedCandidateOfferDecision, DeclinedCandidateOfferDecision],
    Field(discriminator="decision"),
]


class OfferPublicResponse(BaseModel):
    """Candidate-safe response; it excludes internal approval/audit data."""

    id: int
    application_id: int
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str
    candidate_name: str
    candidate_email: str
    job_title: str
    company_name: str
    status: OfferStatus
    signed_at: Optional[datetime] = None
    decline_reason: Optional[str] = None


__all__ = [
    "SignedCandidateOfferDecision",
    "DeclinedCandidateOfferDecision",
    "CandidateOfferDecision",
    "OfferPublicResponse",
]
