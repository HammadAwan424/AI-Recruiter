from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import (
    String,
    Float,
    Text,
    Date,
    ForeignKey,
    DateTime,
    Boolean,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin


class OfferTemplate(Base, BaseModelMixin):
    __tablename__ = "offer_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Offer(Base, BaseModelMixin):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # ──── Foreign Keys with CASCADE & Indexes ────
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Guarantee 1 offer record per candidate application
        index=True,
    )
    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by_user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    job_title: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    base_salary: Mapped[float] = mapped_column(Float, nullable=False)
    bonus_equity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)

    # Expiry date nullable to allow flexible early DRAFT saving
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    offer_letter_text: Mapped[str] = mapped_column(Text, nullable=False)

    # Status: DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | SENT | VIEWED | SIGNED | DECLINED | EXPIRED | REVOKED
    status: Mapped[str] = mapped_column(String, default="DRAFT", index=True, nullable=False)

    # Security Token for candidate access link
    secure_token: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # E-Signature Data
    signature_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # DRAWN | TYPED
    signature_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)   # Base64 image data or typed text
    signer_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    signer_ip: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    signer_user_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    signed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    decline_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Data-Level Cryptographic SHA-256 Audit Hash
    audit_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ──── ORM Relationships ────
    approvals: Mapped[List["OfferApproval"]] = relationship(
        "OfferApproval",
        back_populates="offer",
        cascade="all, delete-orphan",
        order_by="OfferApproval.step_order",
    )


class OfferApproval(Base, BaseModelMixin):
    __tablename__ = "offer_approvals"
    __table_args__ = (
        UniqueConstraint("offer_id", "step_order", name="uq_offer_approval_step"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    offer_id: Mapped[int] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    approver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    step_order: Mapped[int] = mapped_column(default=1, nullable=False)
    status: Mapped[str] = mapped_column(String, default="PENDING", index=True, nullable=False)  # PENDING | APPROVED | REJECTED
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # ──── ORM Relationship ────
    offer: Mapped["Offer"] = relationship("Offer", back_populates="approvals")
