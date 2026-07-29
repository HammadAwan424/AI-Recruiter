from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date, time
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.interview import InterviewModel, InterviewSlot
from app.models.recruitment import Candidate, Application, Job
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
)
from app.utils.security import get_current_user
from app.utils.meeting_generator import generate_video_meeting_link
from app.utils.ical_generator import generate_ical_event
from app.utils.interview_crypto import generate_interview_token

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
        is_booked=False
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

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

    now = datetime.utcnow()
    is_expired = bool(interview.token_expires_at and now > interview.token_expires_at)

    raw_slots = db.query(InterviewSlot).filter(InterviewSlot.is_booked.is_(False)).all()
    typed_slots = [InterviewSlotResponse.model_validate(s) for s in raw_slots]

    cand_name = str(candidate.full_name) if (candidate and candidate.full_name is not None) else "Candidate"
    j_title = str(job.title) if (job and job.title is not None) else "Position"
    comp_name = str(job.company_name) if (job and job.company_name is not None) else "Agentra AI"

    return InterviewPublicSlotResponse(
        self_schedule_token=interview.self_schedule_token or "",
        candidate_name=cand_name,
        job_title=j_title,
        company_name=comp_name,
        duration_minutes=interview.duration_minutes or 45,
        available_slots=typed_slots,
        is_expired=is_expired,
        status=interview.status
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

    db.commit()
    db.refresh(interview)

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

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
    candidate = db.query(Candidate).filter(Candidate.id == payload.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Generate video meeting link (Google Meet / Jitsi fallback)
    meeting_link = generate_video_meeting_link(
        meeting_type=payload.meeting_type or "GOOGLE_MEET",
        title=f"{job.title} — {candidate.full_name}"
    )

    interview_data = payload.model_dump()
    interview_data["meeting_link"] = meeting_link
    interview_data["status"] = "SCHEDULED"

    interview = InterviewModel.from_dict(interview_data)
    db.add(interview)

    # Auto update application status to interview_scheduled
    application = db.query(Application).filter(Application.id == payload.application_id).first()
    if application:
        setattr(application, "status", "interview_scheduled")

    db.commit()
    db.refresh(interview)

    # Attach joined helper fields for response
    setattr(interview, "candidate_name", candidate.full_name)
    setattr(interview, "candidate_email", candidate.email)
    setattr(interview, "job_title", job.title)

    return interview


@router.get("", response_model=List[InterviewResponse])
def list_interviews(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interviews = db.query(InterviewModel).order_by(InterviewModel.scheduled_date.desc()).all()
    results = []

    for item in interviews:
        candidate = db.query(Candidate).filter(Candidate.id == item.candidate_id).first()
        job = db.query(Job).filter(Job.id == item.job_id).first()

        setattr(item, "candidate_name", candidate.full_name if candidate else "Candidate")
        setattr(item, "candidate_email", candidate.email if candidate else "")
        setattr(item, "job_title", job.title if job else "Position")
        results.append(item)

    return results


# ─────────────────────────────────────────────────────────────
# 4. DYNAMIC PATH PARAMETER ROUTES (MUST COME LAST)
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

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

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

    db.commit()
    db.refresh(interview)

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

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

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

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
