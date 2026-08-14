from typing import Iterable

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import JsonOutputParser

from app.agents.job_classification.prompts import (
    JOB_CLASSIFICATION_SYSTEM_PROMPT,
    build_job_classification_prompt,
)
from app.schemas.gmail import (
    JobClassificationBatchResult,
    JobClassificationJob,
    JobClassificationMessage,
    JobClassificationResult,
    JobClassificationRequest,
)
from app.utils.llm_factory import get_llm
from app.utils.logger import get_logger

load_dotenv()

logger = get_logger(__name__, "job_classification.log")

MAX_MESSAGE_TEXT_CHARS = 4000
MAX_JOB_FIELD_CHARS = 2000


def _message_payload(message: JobClassificationMessage) -> dict:
    return {
        "gmail_message_id": message.gmail_message_id,
        "subject": (message.subject or "")[:MAX_MESSAGE_TEXT_CHARS],
        "text_content": (message.text_content or "")[:MAX_MESSAGE_TEXT_CHARS],
    }


def _job_payload(job: JobClassificationJob) -> dict:
    return {
        "id": job.id,
        "title": job.title,
        "department": (job.department or "")[:MAX_JOB_FIELD_CHARS],
        "experience": (job.experience or "")[:MAX_JOB_FIELD_CHARS],
        "skills": (job.skills or "")[:MAX_JOB_FIELD_CHARS],
        "keywords": (job.keywords or "")[:MAX_JOB_FIELD_CHARS],
    }


def _normalize_results(
    results: Iterable[JobClassificationResult],
    messages: list[JobClassificationMessage],
    allowed_job_ids: set[int],
) -> list[JobClassificationResult]:
    result_by_message_id = {}
    for result in results:
        if result.gmail_message_id not in result_by_message_id:
            selected_job_id = result.job_id if result.job_id in allowed_job_ids else None
            result_by_message_id[result.gmail_message_id] = JobClassificationResult(
                gmail_message_id=result.gmail_message_id,
                job_id=selected_job_id,
                confidence=max(0, min(100, result.confidence)),
                rationale=result.rationale,
            )

    normalized = []
    for message in messages:
        normalized.append(
            result_by_message_id.get(
                message.gmail_message_id,
                JobClassificationResult(
                    gmail_message_id=message.gmail_message_id,
                    job_id=None,
                    confidence=0,
                    rationale="Classifier did not return a result for this message",
                ),
            )
        )
    return normalized


def _safe_fallback_results(
    messages: list[JobClassificationMessage],
    reason: str,
) -> list[JobClassificationResult]:
    return [
        JobClassificationResult(
            gmail_message_id=message.gmail_message_id,
            job_id=None,
            confidence=0,
            rationale=reason,
        )
        for message in messages
    ]


def classify_application_emails(
    request: JobClassificationRequest,
) -> JobClassificationBatchResult:
    """Classify a validated Gmail batch against the company's job catalogue."""
    validated_request = JobClassificationRequest.model_validate(request)
    messages = validated_request.messages
    jobs = validated_request.jobs
    if not messages:
        return JobClassificationBatchResult(results=[])
    if not jobs:
        return JobClassificationBatchResult(
            results=_safe_fallback_results(
                messages,
                "No company jobs were available for classification",
            )
        )

    prompt = build_job_classification_prompt(
        messages=[_message_payload(message) for message in messages],
        jobs=[_job_payload(job) for job in jobs],
    )
    llm = get_llm(temperature=0.1, max_tokens=4000)
    allowed_job_ids = {job.id for job in jobs}
    chat_messages = [
        SystemMessage(content=JOB_CLASSIFICATION_SYSTEM_PROMPT),
        HumanMessage(content=prompt),
    ]

    try:
        structured_llm = llm.with_structured_output(JobClassificationBatchResult)
        raw_result = structured_llm.invoke(chat_messages)
        if not isinstance(raw_result, JobClassificationBatchResult):
            raise ValueError("Job classifier returned an invalid structured result")
        return JobClassificationBatchResult(
            results=_normalize_results(raw_result.results, messages, allowed_job_ids)
        )
    except Exception as primary_err:
        logger.warning("Structured job classification failed: %s; trying JSON fallback", primary_err)
        try:
            parser = JsonOutputParser(pydantic_object=JobClassificationBatchResult)
            fallback_prompt = f"{prompt}\n\nReturn JSON matching this schema:\n{parser.get_format_instructions()}"
            raw_response = llm.invoke(
                [
                    SystemMessage(content=JOB_CLASSIFICATION_SYSTEM_PROMPT),
                    HumanMessage(content=fallback_prompt),
                ]
            )
            parsed = parser.parse(raw_response.content)
            fallback_result = JobClassificationBatchResult(**parsed)
            return JobClassificationBatchResult(
                results=_normalize_results(
                    fallback_result.results,
                    messages,
                    allowed_job_ids,
                )
            )
        except Exception as fallback_err:
            logger.error(
                "Job classification failed for the batch. Primary error: %s | Fallback error: %s",
                primary_err,
                fallback_err,
            )
            return JobClassificationBatchResult(
                results=_safe_fallback_results(
                    messages,
                    f"Job classification failed: {primary_err}",
                )
            )
