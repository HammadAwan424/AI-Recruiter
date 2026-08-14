"""Shared offer CRUD schemas.

Approval and public candidate decision contracts live in their respective
domain modules and are intentionally not re-exported here.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.enums import OfferStatus, SignatureType
class OfferTemplateCreate(BaseModel):
    title: str = Field(min_length=1)
    department: str = "GLOBAL"
    content: str = Field(min_length=1)
    is_active: bool = True


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
    base_salary: float = Field(ge=0)
    bonus_equity: Optional[str] = None
    start_date: date
    expiry_date: Optional[date] = None
    offer_letter_text: str = Field(min_length=1)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.expiry_date and self.expiry_date <= self.start_date:
            raise ValueError("expiry_date must be after start_date")
        return self


class OfferUpdate(BaseModel):
    base_salary: Optional[float] = Field(default=None, ge=0)
    bonus_equity: Optional[str] = None
    start_date: Optional[date] = None
    expiry_date: Optional[date] = None
    offer_letter_text: Optional[str] = Field(default=None, min_length=1)

    @model_validator(mode="after")
    def validate_dates(self):
        if self.expiry_date and self.start_date and self.expiry_date <= self.start_date:
            raise ValueError("expiry_date must be after start_date")
        return self


class OfferResponse(BaseModel):
    """Internal HR response; derived candidate/job fields are mapped explicitly."""

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
    status: OfferStatus
    secure_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    signature_type: Optional[SignatureType] = None
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


__all__ = [
    "OfferCreate",
    "OfferUpdate",
    "OfferResponse",
    "OfferTemplateCreate",
    "OfferTemplateResponse",
]
