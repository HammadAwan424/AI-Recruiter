from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, Boolean, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base, BaseModelMixin


class GmailAccount(Base, BaseModelMixin):
    """A company mailbox whose Gmail cursor and message IDs are isolated."""

    __tablename__ = "gmail_accounts"
    __table_args__ = (
        UniqueConstraint("company_id", "email", name="uq_gmail_accounts_company_email"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    email: Mapped[str] = mapped_column(String, nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String, default="gmail", nullable=False)
    token_json: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"), nullable=False, index=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True, server_default=text("true"), nullable=False, index=True)
    last_read: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    created_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    company = relationship("Company", back_populates="gmail_accounts")
    applications = relationship("Application", back_populates="gmail_account")
