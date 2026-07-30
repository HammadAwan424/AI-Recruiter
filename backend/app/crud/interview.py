from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.interview import InterviewModel, InterviewFeedback, InterviewSlot
from app.schemas.interview import InterviewCreate, InterviewFeedbackCreate


def create_interview(db: Session, interview_in: InterviewCreate, meeting_link: str, created_by: Optional[int] = None) -> InterviewModel:
    data = interview_in.model_dump()
    data["meeting_link"] = meeting_link
    interview = InterviewModel(**data, status="SCHEDULED", created_by=created_by)
    db.add(interview)
    db.commit()
    db.refresh(interview)
    return interview


def create_interview_feedback(db: Session, feedback_in: InterviewFeedbackCreate, created_by: Optional[int] = None) -> InterviewFeedback:
    feedback = InterviewFeedback(**feedback_in.model_dump(), created_by=created_by)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
