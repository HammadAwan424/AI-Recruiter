from datetime import date, time, datetime
from typing import Optional, List
from sqlalchemy import (
    String,
    Integer,
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
        Integer,
        default=0,
        index=True,
    )
    slot_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_booked: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class InterviewModel(Base, BaseModelMixin):
    __tablename__ = "interviews_v2"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
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

    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=45)

    meeting_type: Mapped[str] = mapped_column(String, default="GOOGLE_MEET")  # GOOGLE_MEET | JITSI | IN_PERSON
    meeting_link: Mapped[str] = mapped_column(String, nullable=False)

    interviewer_1: Mapped[str] = mapped_column(String, nullable=False)
    interviewer_2: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Candidate Self-Scheduling Token
    self_schedule_token: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Status: SCHEDULED | COMPLETED | CANCELLED | RESCHEDULED
    status: Mapped[str] = mapped_column(String, default="SCHEDULED", index=True, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
