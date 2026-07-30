from datetime import date, datetime
from typing import Optional
from sqlalchemy import (
    String,
    Float,
    Text,
    Date,
    ForeignKey,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin


class OfferTemplate(Base, BaseModelMixin):
    __tablename__ = "offer_templates"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String, nullable=False, index=True)
    department: Mapped[str] = mapped_column(String, default="GLOBAL", index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    # Audit Trail
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ORM Relationship
    company = relationship("Company", back_populates="offer_templates")


class Offer(Base, BaseModelMixin):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    # ──── Foreign Keys ────
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    template_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("offer_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    base_salary: Mapped[float] = mapped_column(Float, nullable=False)
    bonus_equity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)

    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    offer_letter_text: Mapped[str] = mapped_column(Text, nullable=False)

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

    # Audit Trail
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ──── ORM Relationships ────
    application = relationship("Application", back_populates="offer")
    template = relationship("OfferTemplate", backref="offers")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    approval: Mapped[Optional["OfferApproval"]] = relationship(
        "OfferApproval",
        back_populates="offer",
        uselist=False,
        cascade="all, delete-orphan",
    )


class OfferApproval(Base, BaseModelMixin):
    __tablename__ = "offer_approvals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    offer_id: Mapped[int] = mapped_column(
        ForeignKey("offers.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    approver_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    decided_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Audit Trail
    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ──── ORM Relationships ────
    offer: Mapped["Offer"] = relationship("Offer", back_populates="approval")
    approver = relationship("User", foreign_keys=[approver_id])
