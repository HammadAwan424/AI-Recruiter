from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Float, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from app.database import Base, BaseModelMixin


class Application(Base, BaseModelMixin):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
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

    # ──── CV Data ────
    cv_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cv_pdf_path: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    gmail_message_id: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    received_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    parsed_profile: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ──── Status Tracking ────
    current_status: Mapped[str] = mapped_column(String, default="applied", nullable=False, index=True)  # applied | screening | interview | offer_approval | offer_sent | hired
    disposition: Mapped[str] = mapped_column(String, default="active", nullable=False, index=True)      # active | rejected

    # ──── AI CV Screening Evaluation (Denormalized Cache / Rollup) ────
    match_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # ──── Combined Final Score ────
    final_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

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
    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
    interviews = relationship("InterviewModel", back_populates="application", cascade="all, delete-orphan")
    offer = relationship("Offer", back_populates="application", uselist=False, cascade="all, delete-orphan")
    comments = relationship("ApplicationComment", back_populates="application", cascade="all, delete-orphan")
    screening = relationship("ApplicationScreening", back_populates="application", uselist=False, cascade="all, delete-orphan")


class ApplicationScreening(Base, BaseModelMixin):
    __tablename__ = "application_screenings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # ──── Dimension Scores (0-100) ────
    skills_match: Mapped[int] = mapped_column(Integer, nullable=False)
    experience_match: Mapped[int] = mapped_column(Integer, nullable=False)
    education_match: Mapped[int] = mapped_column(Integer, nullable=False)
    keyword_coverage: Mapped[int] = mapped_column(Integer, nullable=False)

    # ──── Application-Level Rollup & Quality Signals ────
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, nullable=False)
    data_quality_flag: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ──── Structured Evidence, Fit Flags & Weights (JSON text) ────
    evidence: Mapped[str] = mapped_column(Text, nullable=False)
    fit_flags: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    weights_used: Mapped[str] = mapped_column(Text, nullable=False)

    # ──── Audit & Model Provenance Metadata ────
    model_used: Mapped[str] = mapped_column(String, default="llama-3.1-8b-instant", nullable=False)
    prompt_version: Mapped[str] = mapped_column(String, default="v2.0", nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # ──── Relationship ────
    application = relationship("Application", back_populates="screening")


class ApplicationComment(Base, BaseModelMixin):
    __tablename__ = "application_comments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    application_id: Mapped[int] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    application = relationship("Application", back_populates="comments")
    author = relationship("User")
