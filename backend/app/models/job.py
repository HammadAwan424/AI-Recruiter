from datetime import datetime
from typing import Optional, List, Any
from sqlalchemy import String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin
from app.domain.enums import JobStatus, db_enum


class Job(Base, BaseModelMixin):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    employment_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    experience: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    salary_range: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    full_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    keywords: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[JobStatus] = mapped_column(
        db_enum(JobStatus, "job_status"), default=JobStatus.PUBLISHED, nullable=False, index=True
    )

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

    # ORM Relationships
    company = relationship("Company", back_populates="jobs")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")
    job_scopes = relationship(
        "UserJobScope",
        back_populates="job",
        foreign_keys="UserJobScope.job_id",
        cascade="all, delete-orphan"
    )

    # Association Proxy: Access assigned User ORM instances directly
    assigned_users: AssociationProxy[List[Any]] = association_proxy("job_scopes", "user")
