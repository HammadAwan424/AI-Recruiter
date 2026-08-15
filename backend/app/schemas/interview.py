from datetime import datetime
from typing import Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.enums import InterviewStatus, MeetingType
from app.schemas.job import JobResponse


class InterviewResponse(BaseModel):
    id: int
    application_id: int
    round_number: int = Field(default=1, ge=1)
    round_label: Optional[str] = None
    schedule_start: Optional[datetime] = None
    schedule_end: Optional[datetime] = None
    meeting_type: MeetingType
    meeting_link: str
    self_schedule_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None
    status: InterviewStatus
    notes: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    job_title: Optional[str] = None
    application_match_score: Optional[float] = Field(default=None, ge=0, le=100)

    model_config = ConfigDict(from_attributes=True)


class InterviewSlotCreate(BaseModel):
    job_id: Optional[int] = None
    schedule_start: datetime
    schedule_end: datetime

    @model_validator(mode="after")
    def validate_interval(self):
        if self.schedule_end <= self.schedule_start:
            raise ValueError("schedule_end must be after schedule_start")
        return self


class InterviewSlotResponse(BaseModel):
    id: int
    interviewer_id: int
    job_id: Optional[int] = None
    schedule_start: datetime
    schedule_end: datetime
    is_booked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewSlotDetail(InterviewSlotResponse):
    job: Optional[JobResponse] = None


class InterviewFeedbackResponse(BaseModel):
    id: int
    interview_interviewer_id: int
    interview_id: Optional[int] = None
    interviewer_id: Optional[int] = None
    technical_score: float = Field(ge=0, le=10)
    communication_score: float = Field(ge=0, le=10)
    notes: Optional[str] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InterviewPublicSlotResponse(BaseModel):
    candidate_name: str
    job_title: str
    company_name: str
    available_slots: list[InterviewSlotResponse] = Field(default_factory=list)


class InterviewCreateBase(BaseModel):
    application_id: int
    round_number: int = Field(default=1, ge=1)
    round_label: Optional[str] = None
    meeting_type: MeetingType = MeetingType.GOOGLE_MEET
    notes: Optional[str] = None


class InterviewerSlotAssignment(BaseModel):
    interviewer_id: int
    slot_id: int


class FixedScheduleInterview(InterviewCreateBase):
    schedule_type: Literal["fixed"] = "fixed"
    assignments: list[InterviewerSlotAssignment] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_assignments(self):
        if len({a.interviewer_id for a in self.assignments}) != len(self.assignments):
            raise ValueError("duplicate interviewer assignments are not allowed")
        if len({a.slot_id for a in self.assignments}) != len(self.assignments):
            raise ValueError("duplicate slot assignments are not allowed")
        return self


class SelfScheduleInterview(InterviewCreateBase):
    schedule_type: Literal["self_schedule"] = "self_schedule"
    self_schedule_token_expires_at: datetime
    interviewer_ids: list[int] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_interviewers(self):
        if len(set(self.interviewer_ids)) != len(self.interviewer_ids):
            raise ValueError("duplicate interviewer IDs are not allowed")
        return self


InterviewCreate = Union[FixedScheduleInterview, SelfScheduleInterview]


class InterviewCreateRequest(BaseModel):
    payload: InterviewCreate = Field(discriminator="schedule_type")


class InterviewRescheduleRequest(BaseModel):
    assignments: list[InterviewerSlotAssignment] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_assignments(self):
        if len({a.interviewer_id for a in self.assignments}) != len(self.assignments):
            raise ValueError("duplicate interviewer assignments are not allowed")
        if len({a.slot_id for a in self.assignments}) != len(self.assignments):
            raise ValueError("duplicate slot assignments are not allowed")
        return self


class InterviewMetadataUpdate(BaseModel):
    meeting_type: Optional[MeetingType] = None
    notes: Optional[str] = None


class InterviewFeedbackCreate(BaseModel):
    interviewer_id: Optional[int] = None
    technical_score: float = Field(ge=0, le=10)
    communication_score: float = Field(ge=0, le=10)
    notes: Optional[str] = None
