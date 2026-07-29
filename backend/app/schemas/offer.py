from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List


# ──── TEMPLATE SCHEMAS ────
class OfferTemplateCreate(BaseModel):
    title: str
    department: Optional[str] = None
    content: str


class OfferTemplateResponse(BaseModel):
    id: int
    title: str
    department: Optional[str] = None
    content: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ──── OFFER CREATION & UPDATE ────
class OfferCreate(BaseModel):
    application_id: int
    candidate_id: int
    job_id: int
    job_title: str
    department: Optional[str] = None
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str
    submit_for_approval: bool = False  # If True, sets status to PENDING_APPROVAL immediately


class OfferUpdate(BaseModel):
    job_title: Optional[str] = None
    department: Optional[str] = None
    base_salary: Optional[float] = None
    bonus_equity: Optional[str] = None
    start_date: Optional[date] = None
    expiry_date: Optional[date] = None
    offer_letter_text: Optional[str] = None


# ──── APPROVAL SCHEMAS ────
class OfferApprovalAction(BaseModel):
    action: str  # APPROVE | REJECT
    comments: Optional[str] = None


class OfferApprovalResponse(BaseModel):
    id: int
    offer_id: int
    approver_id: int
    step_order: int
    status: str
    comments: Optional[str] = None
    decided_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ──── SIGNING SCHEMAS ────
class OfferSignRequest(BaseModel):
    signature_type: str  # DRAWN | TYPED
    signature_data: str  # Base64 PNG image or font text string
    signer_name: str


class OfferDeclineRequest(BaseModel):
    decline_reason: str


# ──── OFFER RESPONSE SCHEMAS ────
class OfferResponse(BaseModel):
    id: int
    application_id: int
    candidate_id: int
    job_id: int
    created_by_user_id: int
    job_title: str
    department: Optional[str] = None
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str
    status: str
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
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OfferPublicResponse(BaseModel):
    secure_token: str
    job_title: str
    department: Optional[str] = None
    company_name: Optional[str] = None
    candidate_name: str
    candidate_email: str
    base_salary: float
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str
    status: str
    signature_type: Optional[str] = None
    signature_data: Optional[str] = None
    signer_name: Optional[str] = None
    signed_at: Optional[datetime] = None
    audit_hash: Optional[str] = None
    is_expired: bool
