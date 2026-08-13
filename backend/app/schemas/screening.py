from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime


class EvidenceItem(BaseModel):
    requirement: str = Field(description="Specific item from job description")
    resume_evidence: str = Field(description="Short quoted or closely-paraphrased fragment from resume showing where found")


class EvidenceBlock(BaseModel):
    matched: List[EvidenceItem] = Field(default_factory=list, description="Specific items from JD supported by resume evidence")
    missing: List[str] = Field(default_factory=list, description="Specific items from JD with no support in resume")


class EvidenceSet(BaseModel):
    skills_match: EvidenceBlock
    experience_match: EvidenceBlock
    education_match: EvidenceBlock
    keyword_coverage: EvidenceBlock


class FitFlag(BaseModel):
    flag: Literal[
        "overqualified",
        "underqualified",
        "employment_gap",
        "frequent_job_changes",
        "career_pivot",
        "salary_expectation_risk"
    ] = Field(description="Identified candidate fit pattern flag category")
    rationale: str = Field(description="One-sentence rationale grounded in resume evidence")


class ScreeningLLMOutput(BaseModel):
    skills_match: int = Field(ge=0, le=100, description="Coverage of specific skills/technologies")
    experience_match: int = Field(ge=0, le=100, description="Relevance and sufficiency of years, seniority level, domain experience")
    education_match: int = Field(ge=0, le=100, description="Alignment of educational background with requirements")
    keyword_coverage: int = Field(ge=0, le=100, description="Explicitly stated requirements with direct or inferred support")
    confidence: int = Field(ge=0, le=100, description="Confidence score reflecting how clear-cut the match was")
    evidence: EvidenceSet
    fit_flags: List[FitFlag] = Field(default_factory=list, description="Candidate risk/fit pattern flags with rationale")
    data_quality_flag: Optional[str] = Field(default=None, description="Note if resume text is truncated/corrupted or JD missing details")


class ScreeningDimensionWeights(BaseModel):
    skills_match: float = 0.35
    experience_match: float = 0.35
    education_match: float = 0.15
    keyword_coverage: float = 0.15


class ScreeningEvaluationDetail(BaseModel):
    skills_match: int
    experience_match: int
    education_match: int
    keyword_coverage: int
    confidence: int
    match_score: float
    weights_used: ScreeningDimensionWeights
    evidence: EvidenceSet
    fit_flags: List[FitFlag] = Field(default_factory=list)
    data_quality_flag: Optional[str] = None
    model_used: str = "llama-3.1-8b-instant"
    prompt_version: str = "v2.0"
    evaluated_at: datetime
