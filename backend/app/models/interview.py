from datetime import date, time, datetime
from typing import Optional
from sqlalchemy import (
    String,
    Integer,
    Float,
    Text,
    Date,
    Time,
    ForeignKey,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin


class InterviewSlot(Base, BaseModelMixin):
    __tablename__ = "interview_slots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[int] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    slot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

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
    interviewer = relationship("User", foreign_keys=[interviewer_id])
    job = relationship("Job", foreign_keys=[job_id])


class InterviewModel(Base, BaseModelMixin):
    __tablename__ = "interviews_v2"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)

    meeting_type: Mapped[str] = mapped_column(String, default="GOOGLE_MEET")  # GOOGLE_MEET | JITSI | IN_PERSON
    meeting_link: Mapped[str] = mapped_column(String, nullable=False)

    interviewer_1_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    interviewer_2_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Candidate Self-Scheduling Token
    self_schedule_token: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Restored Interview Status
    status: Mapped[str] = mapped_column(String, default="SCHEDULED", nullable=False, index=True)  # SCHEDULED | COMPLETED | CANCELLED | RESCHEDULED
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    application = relationship("Application", back_populates="interviews")
    interviewer_1 = relationship("User", foreign_keys=[interviewer_1_id])
    interviewer_2 = relationship("User", foreign_keys=[interviewer_2_id])
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    feedback = relationship("InterviewFeedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class InterviewFeedback(Base, BaseModelMixin):
    __tablename__ = "interview_feedback"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews_v2.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    interview = relationship("InterviewModel", back_populates="feedback")
    interviewer = relationship("User", foreign_keys=[interviewer_id])
