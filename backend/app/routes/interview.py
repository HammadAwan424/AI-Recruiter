from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date, time
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.company import Company
from app.models.interview import InterviewModel, InterviewFeedback, InterviewSlot
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate,
    InterviewUpdate,
    InterviewResponse,
    InterviewSlotCreate,
    InterviewSlotResponse,
    InterviewPublicSlotResponse,
    CandidateScheduleSelectRequest,
    InterviewRescheduleRequest,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
)
from app.crud.interview import create_interview, create_interview_feedback
from app.utils.security import get_current_user
from app.utils.meeting_generator import generate_video_meeting_link
from app.utils.ical_generator import generate_ical_event
from app.utils.interview_crypto import generate_interview_token
from app.agents.evaluation_agent import evaluate_candidate

router = APIRouter(prefix="/interviews", tags=["Interviews"])


# ─────────────────────────────────────────────────────────────
# 1. INTERVIEWER AVAILABILITY SLOTS (STATIC PATHS FIRST)
# ─────────────────────────────────────────────────────────────
@router.post("/slots", response_model=InterviewSlotResponse)
def create_interview_slot(
    payload: InterviewSlotCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    slot = InterviewSlot(
        interviewer_id=current_user["user_id"],
        job_id=payload.job_id or 0,
        slot_date=payload.slot_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_booked=False,
        created_by=current_user["user_id"]
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.get("/slots", response_model=List[InterviewSlotResponse])
def get_available_slots(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    slots = db.query(InterviewSlot).filter(InterviewSlot.is_booked.is_(False)).all()
    return slots


# ─────────────────────────────────────────────────────────────
# 2. PUBLIC CANDIDATE SELF-SCHEDULING TOKEN ENDPOINTS
# ─────────────────────────────────────────────────────────────
@router.get("/public/slots/{token}", response_model=InterviewPublicSlotResponse)
def get_public_schedule_slots(token: str, db: Session = Depends(get_db)):
    interview = db.query(InterviewModel).filter(InterviewModel.self_schedule_token == token).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Invalid or expired scheduling link")

    app = interview.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    now = datetime.utcnow()
    is_expired = bool(interview.token_expires_at and now > interview.token_expires_at)

    raw_slots = db.query(InterviewSlot).filter(InterviewSlot.is_booked.is_(False)).all()
    typed_slots = [InterviewSlotResponse.model_validate(s) for s in raw_slots]

    cand_name = str(candidate.full_name) if (candidate and candidate.full_name is not None) else "Candidate"
    j_title = str(job.title) if (job and job.title is not None) else "Position"
    comp_name = str(job.company.name) if (job and job.company and job.company.name is not None) else "Agentra AI"

    return InterviewPublicSlotResponse(
        candidate_name=cand_name,
        job_title=j_title,
        company_name=comp_name,
        available_slots=typed_slots
    )


@router.post("/public/schedule/{token}", response_model=InterviewResponse)
def candidate_confirm_schedule(
    token: str,
    payload: CandidateScheduleSelectRequest,
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewModel).filter(InterviewModel.self_schedule_token == token).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Invalid scheduling link")

    slot = db.query(InterviewSlot).filter(InterviewSlot.id == payload.slot_id).first()
    if not slot or slot.is_booked:
        raise HTTPException(status_code=400, detail="This time slot is no longer available. Please select another slot.")

    now = datetime.utcnow()
    if interview.token_expires_at and now > interview.token_expires_at:
        raise HTTPException(status_code=400, detail="This scheduling link has expired.")

    # Book slot & update interview schedule
    slot.is_booked = True
    interview.scheduled_date = slot.slot_date
    interview.scheduled_time = slot.start_time
    interview.status = "SCHEDULED"

    if interview.application:
        interview.application.current_status = "interview"

    db.commit()
    db.refresh(interview)

    app = interview.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    setattr(interview, "candidate_name", candidate.full_name if candidate else "Candidate")
    setattr(interview, "candidate_email", candidate.email if candidate else "")
    setattr(interview, "job_title", job.title if job else "Position")

    return interview


# ─────────────────────────────────────────────────────────────
# 3. INTERNAL HR / EXECUTIVE INTERVIEW MANAGEMENT
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=InterviewResponse)
def schedule_interview(
    payload: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    app = db.query(Application).filter(Application.id == payload.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    candidate = app.candidate
    job = app.job

    # Generate video meeting link (Google Meet / Jitsi fallback)
    meeting_link = generate_video_meeting_link(
        meeting_type=payload.meeting_type or "GOOGLE_MEET",
        title=f"{job.title if job else 'Job'} — {candidate.full_name if candidate else 'Candidate'}"
    )

    interview = create_interview(db, payload, meeting_link=meeting_link, created_by=current_user["user_id"])

    # Update application status to interview
    app.current_status = "interview"
    app.updated_by = current_user["user_id"]
    db.commit()

    setattr(interview, "candidate_name", candidate.full_name if candidate else "Candidate")
    setattr(interview, "candidate_email", candidate.email if candidate else "")
    setattr(interview, "job_title", job.title if job else "Position")

    return interview


@router.get("", response_model=List[InterviewResponse])
def list_interviews(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interviews = db.query(InterviewModel).order_by(InterviewModel.scheduled_date.desc()).all()
    results = []

    for item in interviews:
        app = item.application
        candidate = app.candidate if app else None
        job = app.job if app else None

        setattr(item, "candidate_name", candidate.full_name if candidate else "Candidate")
        setattr(item, "candidate_email", candidate.email if candidate else "")
        setattr(item, "job_title", job.title if job else "Position")
        results.append(item)

    return results


# ─────────────────────────────────────────────────────────────
# 4. INTERVIEW FEEDBACK ENDPOINT
# ─────────────────────────────────────────────────────────────
@router.post("/{interview_id}/feedback", response_model=InterviewFeedbackResponse)
def submit_interview_feedback(
    interview_id: int,
    payload: InterviewFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interview = db.query(InterviewModel).filter(InterviewModel.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    feedback = db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview_id).first()
    if feedback:
        feedback.technical_score = payload.technical_score
        feedback.communication_score = payload.communication_score
        feedback.notes = payload.notes
        feedback.interviewer_id = payload.interviewer_id or current_user["user_id"]
        feedback.updated_by = current_user["user_id"]
    else:
        feedback = create_interview_feedback(db, payload, created_by=current_user["user_id"])

    # Update interview status to COMPLETED
    interview.status = "COMPLETED"
    interview.updated_by = current_user["user_id"]

    # Calculate combined final score via Evaluation Agent and store on Application
    app = interview.application
    if app:
        resume_score = app.match_score or 75.0
        eval_result = evaluate_candidate(
            resume_score=resume_score,
            technical_score=payload.technical_score,
            communication_score=payload.communication_score
        )
        app.final_score = eval_result["final_score"]
        app.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(feedback)
    return feedback


# ─────────────────────────────────────────────────────────────
# 5. DYNAMIC PATH PARAMETER ROUTES (MUST COME LAST)
# ─────────────────────────────────────────────────────────────
@router.get("/{interview_id}", response_model=InterviewResponse)
def get_interview_detail(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interview = db.query(InterviewModel).filter(InterviewModel.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    app = interview.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    setattr(interview, "candidate_name", candidate.full_name if candidate else "Candidate")
    setattr(interview, "candidate_email", candidate.email if candidate else "")
    setattr(interview, "job_title", job.title if job else "Position")

    return interview


@router.post("/{interview_id}/self-schedule-link", response_model=InterviewResponse)
def create_candidate_self_schedule_link(
    interview_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interview = db.query(InterviewModel).filter(InterviewModel.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    token = generate_interview_token()
    interview.self_schedule_token = token
    interview.token_expires_at = datetime.utcnow() + timedelta(days=7)
    interview.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(interview)

    app = interview.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    setattr(interview, "candidate_name", candidate.full_name if candidate else "Candidate")
    setattr(interview, "candidate_email", candidate.email if candidate else "")
    setattr(interview, "job_title", job.title if job else "Position")

    print(f"[INTERVIEW SELF-SCHEDULE LINK] Link: http://localhost:5173/interview/schedule/{token}")
    return interview


@router.get("/{interview_id}/ical")
def download_interview_ical(interview_id: int, db: Session = Depends(get_db)):
    interview = db.query(InterviewModel).filter(InterviewModel.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    app = interview.application
    candidate = app.candidate if app else None
    job = app.job if app else None

    candidate_name = str(candidate.full_name) if (candidate and candidate.full_name is not None) else "Candidate"
    job_title = str(job.title) if (job and job.title is not None) else "Position"
    attendee_email_str = str(candidate.email) if (candidate and candidate.email is not None) else ""

    ical_data = generate_ical_event(
        title=f"Interview: {job_title} — {candidate_name}",
        description=f"Job Interview for {job_title} at Agentra.",
        scheduled_date=interview.scheduled_date,
        scheduled_time=interview.scheduled_time,
        duration_minutes=interview.duration_minutes or 45,
        location_url=interview.meeting_link,
        attendee_email=attendee_email_str
    )

    return Response(
        content=ical_data,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=interview_{interview_id}.ics"}
    )
