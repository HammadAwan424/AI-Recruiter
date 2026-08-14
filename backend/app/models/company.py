from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin


class Company(Base, BaseModelMixin):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    gmail_last_read: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)

    # Audit Trail (Integer IDs to prevent circular DDL FK dependency with User during drop_all)
    created_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )
    updated_by: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    # ORM Relationships
    users = relationship("User", back_populates="company", foreign_keys="User.company_id")
    jobs = relationship("Job", back_populates="company")
    offer_templates = relationship("OfferTemplate", back_populates="company")
