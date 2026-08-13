from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, Query, joinedload
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.company import Company
from app.models.interview import InterviewInterviewers, InterviewModel, InterviewFeedback, InterviewSlot
from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.user import User
from app.models.rbac import UserJobScope
from app.schemas.interview import (
    InterviewCreate,
    InterviewCreateRequest,
    InterviewResponse,
    InterviewSlotCreate,
    InterviewSlotResponse,
    InterviewSlotDetail,
    InterviewPublicSlotResponse,
    InterviewRescheduleRequest,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
)
from app.schemas.composite import InterviewerDetail, InterviewDetail
from app.crud.interview import create_interview, create_interview_feedback
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_scoped_interviews_query,
    get_interview_or_403,
    get_application_or_403
)
from app.utils.meeting_generator import generate_video_meeting_link
from app.utils.ical_generator import generate_ical_event
from app.utils.interview_crypto import generate_interview_token
from app.utils.candidate_evaluation import evaluate_candidate
from app.services.gmail import (
    notify_candidate_interview_invite,
    notify_candidate_self_schedule,
    notify_interviewer_assignment,
)

router = APIRouter(prefix="/interviews", tags=["Interviews"])


class AssignInterviewerPayload(BaseModel):
    interviewer_ids: list[int]


def auto_grant_user_job_scope(db: Session, user_id: int, job_id: int, created_by: Optional[int] = None):
    existing = db.query(UserJobScope).filter_by(user_id=user_id, job_id=job_id).first()
    if not existing:
        scope = UserJobScope(user_id=user_id, job_id=job_id, created_by=created_by)
        db.add(scope)


# ─────────────────────────────────────────────────────────────
# 1. INTERVIEWER AVAILABILITY SLOTS
# ─────────────────────────────────────────────────────────────
@router.post("/slots", response_model=InterviewSlotDetail)
def create_interview_slot(
    payload: InterviewSlotCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    slot = InterviewSlot(
        interviewer_id=current_user["user_id"],
        job_id=payload.job_id,
        schedule_start=payload.schedule_start,
        schedule_end=payload.schedule_end,
        is_booked=False,
        created_by=current_user["user_id"]
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    if slot.job_id:
        db.refresh(slot, ["job"])
    return slot


@router.get("/slots", response_model=List[InterviewSlotDetail])
def get_available_slots(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    slots = (
        db.query(InterviewSlot)
        .options(joinedload(InterviewSlot.job))
        .filter(InterviewSlot.is_booked.is_(False))
        .order_by(InterviewSlot.schedule_start.asc())
        .all()
    )
    return slots


@router.get("/interviewers", response_model=List[InterviewerDetail])
def get_interviewers_with_slots(
    job_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    company_id = current_user.get("company_id")
    interviewers = (
        db.query(User)
        .options(
            joinedload(User.available_slots).joinedload(InterviewSlot.job)
        )
        .filter(User.company_id == company_id, User.role == "interviewer")
        .all()
    )
    return interviewers


@router.put("/slots/{slot_id}", response_model=InterviewSlotDetail)
def update_interview_slot(
    slot_id: int,
    payload: InterviewSlotCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    slot = db.query(InterviewSlot).filter(InterviewSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.is_booked:
        raise HTTPException(status_code=400, detail="Cannot edit a slot that is already booked.")

    slot.job_id = payload.job_id
    slot.schedule_start = payload.schedule_start
    slot.schedule_end = payload.schedule_end
    slot.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(slot)
    if slot.job_id:
        db.refresh(slot, ["job"])

    return slot


@router.delete("/slots/{slot_id}")
def delete_interview_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    slot = db.query(InterviewSlot).filter(InterviewSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.is_booked:
        raise HTTPException(status_code=400, detail="Cannot delete a slot that is already booked.")

    db.delete(slot)
    db.commit()
    return {"message": "Slot deleted successfully"}


# ─────────────────────────────────────────────────────────────
# 2. PUBLIC CANDIDATE SELF-SCHEDULING TOKEN ENDPOINTS
# ─────────────────────────────────────────────────────────────
@router.get("/public/slots/{token}", response_model=InterviewPublicSlotResponse)
def get_public_schedule_slots(token: str, db: Session = Depends(get_db)):
    interview = db.query(InterviewModel).filter(InterviewModel.self_schedule_token == token).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Invalid or expired scheduling link")

    now = datetime.utcnow()
    if interview.token_expires_at and now > interview.token_expires_at:
        raise HTTPException(status_code=400, detail="This scheduling link has expired.")

    if interview.status != "AWAITING_SELECTION":
        raise HTTPException(status_code=400, detail="This interview has already been scheduled or completed.")

    assignments = interview.interviewer_assignments
    if len(assignments) == 0:
        raise HTTPException(status_code=400, detail="No interviewer assigned to this interview round.")
    if len(assignments) > 1:
        raise HTTPException(status_code=400, detail="Multiple interviewers assigned to self-schedule round is not supported yet.")

    interviewer_id = assignments[0].interviewer_id
    raw_slots = (
        db.query(InterviewSlot)
        .filter(
            InterviewSlot.interviewer_id == interviewer_id,
            InterviewSlot.is_booked.is_(False)
        )
        .order_by(InterviewSlot.schedule_start.asc())
        .all()
    )
    typed_slots = [InterviewSlotResponse.model_validate(s) for s in raw_slots]

    app = interview.application
    return InterviewPublicSlotResponse(
        candidate_name=app.candidate.full_name,
        job_title=app.job.title,
        company_name=app.job.company.name,
        available_slots=typed_slots
    )


@router.post("/public/schedule/{token}", response_model=InterviewResponse)
def candidate_confirm_schedule(
    token: str,
    payload: InterviewRescheduleRequest,
    db: Session = Depends(get_db)
):
    interview = db.query(InterviewModel).filter(InterviewModel.self_schedule_token == token).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Invalid scheduling link")

    now = datetime.utcnow()
    if interview.token_expires_at and now > interview.token_expires_at:
        raise HTTPException(status_code=400, detail="This scheduling link has expired.")

    if interview.status != "AWAITING_SELECTION":
        raise HTTPException(status_code=400, detail="This interview has already been scheduled.")

    slot_ids = [a.slot_id for a in payload.assignments]
    slots = db.query(InterviewSlot).filter(InterviewSlot.id.in_(slot_ids)).all() if slot_ids else []

    if not slots or any(s.is_booked for s in slots):
        raise HTTPException(status_code=400, detail="One or more selected slots are no longer available.")

    interview.schedule_start = min(s.schedule_start for s in slots)
    interview.schedule_end = min(s.schedule_end for s in slots)
    interview.status = "SCHEDULED"

    for slot in slots:
        slot.is_booked = True

    for assignment in payload.assignments:
        existing = (
            db.query(InterviewInterviewers)
            .filter_by(interview_id=interview.id, interviewer_id=assignment.interviewer_id)
            .first()
        )
        if not existing:
            assoc = InterviewInterviewers(interview_id=interview.id, interviewer_id=assignment.interviewer_id)
            db.add(assoc)

    if interview.application:
        interview.application.current_status = "interview"

    db.commit()
    db.refresh(interview)

    app = interview.application
    interview.candidate_name = app.candidate.full_name
    interview.candidate_email = app.candidate.email
    interview.job_title = app.job.title

    return interview


# ─────────────────────────────────────────────────────────────
# 3. INTERNAL HR / EXECUTIVE INTERVIEW MANAGEMENT
# ─────────────────────────────────────────────────────────────
@router.post(
    "",
    response_model=InterviewResponse,
    dependencies=[Depends(require_permissions(["interview:create"]))]
)
def schedule_interview(
    request: InterviewCreateRequest,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interview_in = request.payload
    app = get_application_or_403(interview_in.application_id, db=db, current_user=current_user)

    meeting_link = generate_video_meeting_link(
        meeting_type=interview_in.meeting_type,
        title=f"{app.job.title} — {app.candidate.full_name}"
    )

    interview = create_interview(db, request, meeting_link=meeting_link, created_by=current_user["user_id"])

    # Auto-grant UserJobScope to assigned interviewers
    interviewer_ids = []
    if interview_in.schedule_type == "fixed":
        interviewer_ids = [a.interviewer_id for a in interview_in.assignments]
    elif interview_in.schedule_type == "self_schedule":
        interviewer_ids = interview_in.interviewer_ids

    for uid in interviewer_ids:
        auto_grant_user_job_scope(db, uid, app.job_id, current_user["user_id"])

    app.current_status = "interview"
    app.updated_by = current_user["user_id"]
    db.commit()

    interview.candidate_name = app.candidate.full_name
    interview.candidate_email = app.candidate.email
    interview.job_title = app.job.title

    # 1-liner Notifications Dispatch
    if interview_in.schedule_type == "self_schedule":
        if interview.self_schedule_token and app.candidate.email:
            notify_candidate_self_schedule(
                candidate_email=app.candidate.email,
                candidate_name=app.candidate.full_name,
                job_title=app.job.title,
                schedule_token=interview.self_schedule_token
            )
    else:
        scheduled_date_str = str(interview.schedule_start.date()) if interview.schedule_start else "Scheduled"
        scheduled_time_str = str(interview.schedule_start.time()) if interview.schedule_start else "Scheduled"
        if app.candidate.email:
            notify_candidate_interview_invite(
                candidate_email=app.candidate.email,
                candidate_name=app.candidate.full_name,
                job_title=app.job.title,
                meeting_link=meeting_link or "",
                scheduled_date=scheduled_date_str,
                scheduled_time=scheduled_time_str
            )
        for assignment in interview.interviewer_assignments:
            interviewer = assignment.interviewer
            if interviewer and interviewer.email:
                notify_interviewer_assignment(
                    interviewer_email=interviewer.email,
                    interviewer_name=interviewer.full_name,
                    candidate_name=app.candidate.full_name,
                    job_title=app.job.title,
                    scheduled_date=scheduled_date_str,
                    scheduled_time=scheduled_time_str,
                    meeting_link=meeting_link or ""
                )

    return interview


@router.get("", response_model=List[InterviewDetail], dependencies=[Depends(require_permissions(["interview:view"]))])
def list_interviews(
    db: Session = Depends(get_db),
    interviews_query: Query = Depends(get_scoped_interviews_query)
):
    interviews = (
        interviews_query
        .options(
            joinedload(InterviewModel.interviewer_assignments).joinedload(InterviewInterviewers.interviewer)
        )
        .order_by(InterviewModel.schedule_start.desc())
        .all()
    )

    for item in interviews:
        app = item.application
        item.candidate_name = app.candidate.full_name
        item.candidate_email = app.candidate.email
        item.job_title = app.job.title

    return interviews


# ─────────────────────────────────────────────────────────────
# 4. INTERVIEW FEEDBACK / SCORING ENDPOINT (REQUIRES take_interview PERMISSION)
# ─────────────────────────────────────────────────────────────
@router.post(
    "/{interview_id}/feedback",
    response_model=InterviewFeedbackResponse,
    dependencies=[Depends(require_permissions(["interview:submit_feedback"]))]
)
def submit_interview_feedback(
    payload: InterviewFeedbackCreate,
    interview: InterviewModel = Depends(get_interview_or_403),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    interviewer_id = payload.interviewer_id or current_user["user_id"]

    assignment = (
        db.query(InterviewInterviewers)
        .filter_by(interview_id=interview.id, interviewer_id=interviewer_id)
        .first()
    )
    if not assignment:
        assignment = InterviewInterviewers(interview_id=interview.id, interviewer_id=interviewer_id)
        db.add(assignment)
        db.flush()

    feedback = db.query(InterviewFeedback).filter_by(interview_interviewer_id=assignment.id).first()

    if feedback:
        feedback.technical_score = payload.technical_score
        feedback.communication_score = payload.communication_score
        feedback.notes = payload.notes
        feedback.updated_by = current_user["user_id"]
    else:
        feedback = InterviewFeedback(
            interview_interviewer_id=assignment.id,
            technical_score=payload.technical_score,
            communication_score=payload.communication_score,
            notes=payload.notes,
            created_by=current_user["user_id"]
        )
        db.add(feedback)

    interview.status = "COMPLETED"
    interview.updated_by = current_user["user_id"]

    app = interview.application
    if app:
        all_feedbacks = (
            db.query(InterviewFeedback)
            .join(InterviewInterviewers)
            .filter(InterviewInterviewers.interview_id == interview.id)
            .all()
        )

        eval_result = evaluate_candidate(all_feedbacks)
        app.final_score = eval_result["final_score"]
        app.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(feedback)
    return feedback


# ─────────────────────────────────────────────────────────────
# 5. DYNAMIC PATH PARAMETER ROUTES (MUST COME LAST)
# ─────────────────────────────────────────────────────────────
@router.get(
    "/{interview_id}",
    response_model=InterviewResponse,
    dependencies=[Depends(require_permissions(["interview:view"]))]
)
def get_interview_detail(
    interview: InterviewModel = Depends(get_interview_or_403)
):
    app = interview.application
    interview.candidate_name = app.candidate.full_name
    interview.candidate_email = app.candidate.email
    interview.job_title = app.job.title

    return interview


@router.post(
    "/{interview_id}/self-schedule-link",
    response_model=InterviewResponse,
    dependencies=[Depends(require_permissions(["interview:create"]))]
)
def create_candidate_self_schedule_link(
    interview: InterviewModel = Depends(get_interview_or_403),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    token = generate_interview_token()
    interview.self_schedule_token = token
    interview.token_expires_at = datetime.utcnow() + timedelta(days=7)
    interview.updated_by = current_user["user_id"]

    db.commit()
    db.refresh(interview)

    app = interview.application
    interview.candidate_name = app.candidate.full_name
    interview.candidate_email = app.candidate.email
    interview.job_title = app.job.title

    return interview


@router.get("/{interview_id}/ical")
def download_interview_ical(
    interview: InterviewModel = Depends(get_interview_or_403)
):
    app = interview.application

    ical_data = generate_ical_event(
        title=f"Interview: {app.job.title} — {app.candidate.full_name}",
        description=f"Job Interview for {app.job.title} at AI Recruiter.",
        start_time=interview.schedule_start,
        end_time=interview.schedule_end,
        location_url=interview.meeting_link,
        attendee_email=app.candidate.email
    )

    return Response(
        content=ical_data,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename=interview_{interview.id}.ics"}
    )
