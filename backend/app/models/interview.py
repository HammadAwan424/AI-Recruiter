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
    UniqueConstraint,
    CheckConstraint,
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin
from app.domain.enums import InterviewStatus, MeetingType, db_enum


class InterviewSlot(Base, BaseModelMixin):
    __tablename__ = "interview_slots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    schedule_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    schedule_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
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
    interviewer = relationship("User", foreign_keys=[interviewer_id], back_populates="slots")
    job = relationship("Job", foreign_keys=[job_id])


class InterviewModel(Base, BaseModelMixin):
    __tablename__ = "interviews_v2"
    __table_args__ = (
        CheckConstraint("round_number >= 1", name="ck_interviews_round_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    round_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    round_label: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    schedule_start: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    schedule_end: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    meeting_type: Mapped[MeetingType] = mapped_column(
        db_enum(MeetingType, "meeting_type"), default=MeetingType.GOOGLE_MEET, nullable=False
    )
    meeting_link: Mapped[str] = mapped_column(String, nullable=False)


    # Candidate Self-Scheduling Token
    self_schedule_token: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Restored Interview Status
    status: Mapped[InterviewStatus] = mapped_column(
        db_enum(InterviewStatus, "interview_status"),
        default=InterviewStatus.SCHEDULED,
        nullable=False,
        index=True,
    )
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
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    interviewer_assignments = relationship(
        "InterviewInterviewers", back_populates="interview", cascade="all, delete-orphan"
    )


class InterviewInterviewers(Base, BaseModelMixin):
    __tablename__ = "interview_interviewers"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interview_id: Mapped[int] = mapped_column(
        ForeignKey("interviews_v2.id", ondelete="CASCADE"), nullable=False, index=True
    )
    interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    __table_args__ = (UniqueConstraint("interview_id", "interviewer_id"),)  # no duplicate assignments

    interview = relationship("InterviewModel", back_populates="interviewer_assignments")
    interviewer = relationship("User", foreign_keys=[interviewer_id])
    feedback = relationship(
        "InterviewFeedback", back_populates="interview_interviewer",
        uselist=False, cascade="all, delete-orphan",
    )
    



class InterviewFeedback(Base, BaseModelMixin):
    __tablename__ = "interview_feedback"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    interview_interviewer_id: Mapped[int] = mapped_column(
        ForeignKey("interview_interviewers.id", ondelete="CASCADE"),
        nullable=False, index=True, unique=True,   # <- one feedback per assignment
    )
    technical_score: Mapped[float] = mapped_column(Float, nullable=False)
    communication_score: Mapped[float] = mapped_column(Float, nullable=False)
    __table_args__ = (
        CheckConstraint("technical_score BETWEEN 0 AND 10", name="ck_feedback_technical_score"),
        CheckConstraint("communication_score BETWEEN 0 AND 10", name="ck_feedback_communication_score"),
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    updated_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    interview_interviewer = relationship("InterviewInterviewers", back_populates="feedback")

    @property
    def interview_id(self) -> Optional[int]:
        return self.interview_interviewer.interview_id if self.interview_interviewer else None

    @property
    def interviewer_id(self) -> Optional[int]:
        return self.interview_interviewer.interviewer_id if self.interview_interviewer else None
