from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from app.models.interview import InterviewModel, InterviewFeedback, InterviewSlot, InterviewInterviewers
from app.schemas.interview import InterviewCreate, FixedScheduleInterview, InterviewCreateRequest, SelfScheduleInterview, InterviewFeedbackCreate
from app.utils.interview_crypto import generate_interview_token


def create_interview(
    db: Session,
    interview: InterviewCreateRequest,
    meeting_link: str,
    created_by: Optional[int] = None
) -> InterviewModel:
    payload = interview.payload

    schedule_start: Optional[datetime] = None
    schedule_end: Optional[datetime] = None
    self_schedule_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    status: str = "SCHEDULED"
    interviewer_ids: List[int] = []

    if payload.schedule_type == "fixed":
        status = "SCHEDULED"
        slot_ids = [a.slot_id for a in payload.assignments]
        slots = db.query(InterviewSlot).filter(InterviewSlot.id.in_(slot_ids)).all() if slot_ids else []

        if slots:
            schedule_start = min(s.schedule_start for s in slots)
            schedule_end = min(s.schedule_end for s in slots)
            for slot in slots:
                slot.is_booked = True

        for assignment in payload.assignments:
            if assignment.interviewer_id not in interviewer_ids:
                interviewer_ids.append(assignment.interviewer_id)

    else:
        # payload.schedule_type == "self_schedule"
        status = "AWAITING_SELECTION"
        self_schedule_token = generate_interview_token()
        token_expires_at = payload.self_schedule_token_expires_at
        interviewer_ids = list(payload.interviewer_ids)

    interview_model = InterviewModel(
        application_id=payload.application_id,
        round_number=payload.round_number,
        round_label=payload.round_label,
        meeting_type=payload.meeting_type,
        meeting_link=meeting_link,
        notes=payload.notes,
        schedule_start=schedule_start,
        schedule_end=schedule_end,
        self_schedule_token=self_schedule_token,
        token_expires_at=token_expires_at,
        status=status,
        created_by=created_by
    )
    db.add(interview_model)
    db.flush()

    for uid in interviewer_ids:
        assoc = InterviewInterviewers(interview_id=interview_model.id, interviewer_id=uid)
        db.add(assoc)

    db.commit()
    db.refresh(interview_model)
    return interview_model


def create_interview_feedback(db: Session, feedback_in: InterviewFeedbackCreate, created_by: Optional[int] = None) -> InterviewFeedback:
    assignment = (
        db.query(InterviewInterviewers)
        .filter_by(interview_id=feedback_in.interview_id, interviewer_id=feedback_in.interviewer_id)
        .first()
    )
    if not assignment:
        assignment = InterviewInterviewers(
            interview_id=feedback_in.interview_id,
            interviewer_id=feedback_in.interviewer_id
        )
        db.add(assignment)
        db.flush()

    feedback = InterviewFeedback(
        interview_interviewer_id=assignment.id,
        technical_score=feedback_in.technical_score,
        communication_score=feedback_in.communication_score,
        notes=feedback_in.notes,
        created_by=created_by
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
