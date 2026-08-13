from pydantic import BaseModel, Field
from typing import List, Optional


class WorkHistoryEntry(BaseModel):
    title: str = Field(description="Job title preserved as written in resume")
    company: str = Field(description="Company or organization name")
    start_date: str = Field(description="Start date as written (or empty string if missing)")
    end_date: str = Field(description="End date as written, e.g. Present (or empty string if missing)")


class EducationEntry(BaseModel):
    degree: str = Field(description="Degree or program name")
    institution: str = Field(description="University, college, or school name")
    year: str = Field(description="Graduation or expected year")


class ParsingLLMOutput(BaseModel):
    skills: List[str] = Field(default_factory=list, description="Flat list of skills, tools, and languages")
    work_history: List[WorkHistoryEntry] = Field(default_factory=list, description="List of work history entries")
    education: List[EducationEntry] = Field(default_factory=list, description="List of education entries")
    certifications: List[str] = Field(default_factory=list, description="List of professional certifications")
    needs_review: bool = Field(default=False, description="Flag set to true if resume text is garbled/truncated or ambiguous")
    review_reason: Optional[str] = Field(default=None, description="Short rationale if needs_review is true")
