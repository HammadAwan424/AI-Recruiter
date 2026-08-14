from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin
from app.domain.enums import JobDistributionStatus, db_enum


class JobDistribution(Base, BaseModelMixin):
    __tablename__ = "job_distributions"
    __table_args__ = (
        UniqueConstraint("job_id", "board", name="uq_job_distributions_job_board"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    board: Mapped[str] = mapped_column(String, nullable=False, index=True)
    status: Mapped[JobDistributionStatus] = mapped_column(
        db_enum(JobDistributionStatus, "job_distribution_status"),
        default=JobDistributionStatus.PENDING,
        nullable=False,
        index=True,
    )
    external_ref: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    job = relationship("Job", foreign_keys=[job_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
