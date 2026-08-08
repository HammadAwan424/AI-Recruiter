from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime
from typing import Optional, Literal, Union


# ──── Executive Decision Discriminated Union ────
class ExecutiveOfferDecisionBase(BaseModel):
    decision: str


class ApprovedExecutiveOfferDecision(ExecutiveOfferDecisionBase):
    decision: Literal["approved"] = "approved"
    comments: Optional[str] = None


class RejectedExecutiveOfferDecision(ExecutiveOfferDecisionBase):
    decision: Literal["rejected"] = "rejected"
    comments: Optional[str] = None


ExecutiveOfferDecision = Union[ApprovedExecutiveOfferDecision, RejectedExecutiveOfferDecision]


# ──── Candidate Public Decision Discriminated Union ────
class CandidateOfferDecisionBase(BaseModel):
    decision: str


class SignedCandidateOfferDecision(CandidateOfferDecisionBase):
    decision: Literal["signed"] = "signed"
    signer_name: str
    signature_type: str = "TYPED"
    signature_data: str


class DeclinedCandidateOfferDecision(CandidateOfferDecisionBase):
    decision: Literal["declined"] = "declined"
    decline_reason: str


CandidateOfferDecision = Union[SignedCandidateOfferDecision, DeclinedCandidateOfferDecision]


class OfferApprovalAction(BaseModel):
    action: Optional[str] = "APPROVE"
    comments: Optional[str] = None


class OfferSignRequest(BaseModel):
    signer_name: str
    signature_type: str  # DRAWN | TYPED
    signature_data: str


class OfferDeclineRequest(BaseModel):
    decline_reason: str


class OfferTemplateCreate(BaseModel):
    title: str
    department: Optional[str] = "GLOBAL"
    content: str
    is_active: Optional[bool] = True


class OfferTemplateResponse(BaseModel):
    id: int
    company_id: Optional[int] = None
    title: str
    department: str
    content: str
    is_active: bool
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OfferCreate(BaseModel):
    application_id: int
    template_id: Optional[int] = None
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str


class OfferUpdate(BaseModel):
    base_salary: Optional[float] = None
    bonus_equity: Optional[str] = None
    start_date: Optional[date] = None
    expiry_date: Optional[date] = None
    offer_letter_text: Optional[str] = None
    updated_by: Optional[int] = None


class OfferResponse(BaseModel):
    id: int
    application_id: int
    candidate_id: Optional[int] = None
    job_id: Optional[int] = None
    job_title: Optional[str] = None
    department: Optional[str] = None
    candidate_name: Optional[str] = None
    template_id: Optional[int] = None
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str
    status: Optional[str] = "PENDING_APPROVAL"
    secure_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    signature_type: Optional[str] = None
    signature_data: Optional[str] = None
    signer_name: Optional[str] = None
    signer_ip: Optional[str] = None
    signer_user_agent: Optional[str] = None
    signed_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
    audit_hash: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OfferApprovalAction(BaseModel):
    action: Optional[str] = "APPROVE"
    comments: Optional[str] = None


class OfferDecisionPayload(BaseModel):
    status: str  # "approved" | "rejected"
    comments: Optional[str] = None


class OfferSignRequest(BaseModel):
    signer_name: str
    signature_type: str  # DRAWN | TYPED
    signature_data: str


class OfferDeclineRequest(BaseModel):
    decline_reason: str


class OfferPublicResponse(BaseModel):
    id: int
    application_id: int
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    signed_at: Optional[datetime] = None
    decline_reason: Optional[str] = None
