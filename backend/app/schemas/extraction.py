from typing import Literal

from app.schemas.base import StrictSchema
from app.schemas.parsing import ParsingLLMOutput
from app.schemas.screening import ScreeningLLMOutput


class ExtractedResumeText(StrictSchema):
    schema_version: Literal["extraction.extracted_resume_text.v1"]
    source_name: str
    cv_text: str


class JobSpec(StrictSchema):
    schema_version: Literal["extraction.job_spec.v1"]
    title: str
    description: str
    skills: str


class ParsedResumeProfile(StrictSchema):
    schema_version: Literal["extraction.parsed_resume_profile.v1"]
    source_name: str
    profile: ParsingLLMOutput


class ResumeScreeningInput(StrictSchema):
    schema_version: Literal["extraction.resume_screening_input.v1"]
    source_name: str
    resume: ExtractedResumeText
    job: JobSpec


class ScreeningResult(StrictSchema):
    schema_version: Literal["extraction.screening_result.v1"]
    source_name: str
    job_title: str
    result: ScreeningLLMOutput
