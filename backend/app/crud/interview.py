from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.interview import InterviewModel, InterviewFeedback, InterviewSlot, InterviewInterviewers
from app.schemas.interview import InterviewCreate, InterviewFeedbackCreate


def create_interview(db: Session, interview_in: InterviewCreate, meeting_link: str, created_by: Optional[int] = None) -> InterviewModel:
    data = interview_in.model_dump()
    interviewer_ids = data.pop("interviewer_ids", [])
    data["meeting_link"] = meeting_link
    interview = InterviewModel(**data, status="SCHEDULED", created_by=created_by)
    db.add(interview)
    db.flush()

    for uid in (interviewer_ids or []):
        assignment = InterviewInterviewers(interview_id=interview.id, interviewer_id=uid)
        db.add(assignment)

    db.commit()
    db.refresh(interview)
    return interview


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
