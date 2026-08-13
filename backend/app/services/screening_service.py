import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.models.job import Job
from app.models.application import Application, ApplicationScreening
from app.schemas.screening import (
    ScreeningLLMOutput,
    ScreeningDimensionWeights,
    ScreeningEvaluationDetail,
    EvidenceSet
)
from app.agents.screening import evaluate_cv_structured

CONFIDENCE_HUMAN_REVIEW_THRESHOLD = 60  # Confidence < 60 routes to human review
PASS_MATCH_SCORE_THRESHOLD = 70.0       # Match score >= 70 moves to screening


def resolve_dimension_weights(job: Job) -> ScreeningDimensionWeights:
    """Resolves custom job screening weights or defaults to 35% skills, 35% experience, 15% education, 15% keywords."""
    if hasattr(job, "screening_weights") and job.screening_weights:
        try:
            data = json.loads(job.screening_weights)
            return ScreeningDimensionWeights(**data)
        except Exception:
            pass
    return ScreeningDimensionWeights()  # Default: skills=0.35, experience=0.35, education=0.15, keyword_coverage=0.15


def compute_weighted_match_score(
    output: ScreeningLLMOutput,
    weights: ScreeningDimensionWeights
) -> float:
    """Computes deterministic application-layer weighted rollup score clamped between 0 and 100."""
    score = (
        output.skills_match * weights.skills_match +
        output.experience_match * weights.experience_match +
        output.education_match * weights.education_match +
        output.keyword_coverage * weights.keyword_coverage
    )
    return round(min(100.0, max(0.0, score)), 2)


def run_screening_for_application(
    db: Session,
    application_id: int
) -> ScreeningEvaluationDetail:
    """Orchestrates complete AI screening for an application and persists DB records."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError(f"Application #{application_id} not found")

    job = app.job
    if not job:
        raise ValueError(f"Job not found for Application #{application_id}")

    cv_text = app.cv_text or ""
    job_title = job.title or "Position"
    job_description = job.full_description or ""
    job_skills = job.skills or ""

    # 1. Resolve Weights & Invoke Evaluator Agent
    weights = resolve_dimension_weights(job)
    llm_output: ScreeningLLMOutput = evaluate_cv_structured(
        cv_text=cv_text,
        job_title=job_title,
        job_description=job_description,
        job_skills=job_skills
    )

    # 2. Compute Weighted Rollup Score
    match_score = compute_weighted_match_score(llm_output, weights)

    # 3. Apply Confidence Gating & Business Rules
    if llm_output.confidence < CONFIDENCE_HUMAN_REVIEW_THRESHOLD:
        # Route to human review: maintain applied status, active disposition
        current_status = "applied"
        disposition = "active"
    else:
        if match_score >= PASS_MATCH_SCORE_THRESHOLD:
            current_status = "screening"
            disposition = "active"
        else:
            current_status = "applied"
            disposition = "rejected"

    # 4. Serialize JSON Evidence, Fit Flags & Weights
    evidence_json = llm_output.evidence.model_dump_json()
    fit_flags_json = json.dumps([f.model_dump() for f in llm_output.fit_flags]) if llm_output.fit_flags else "[]"
    weights_json = weights.model_dump_json()

    # 5. Database Persistence (ApplicationScreening 1-to-1 entity)
    existing_screening = db.query(ApplicationScreening).filter(
        ApplicationScreening.application_id == application_id
    ).first()

    now = datetime.utcnow()

    if existing_screening:
        screening_rec = existing_screening
        screening_rec.skills_match = llm_output.skills_match
        screening_rec.experience_match = llm_output.experience_match
        screening_rec.education_match = llm_output.education_match
        screening_rec.keyword_coverage = llm_output.keyword_coverage
        screening_rec.match_score = match_score
        screening_rec.confidence = llm_output.confidence
        screening_rec.data_quality_flag = llm_output.data_quality_flag
        screening_rec.evidence = evidence_json
        screening_rec.fit_flags = fit_flags_json
        screening_rec.weights_used = weights_json
        screening_rec.model_used = "llama-3.1-8b-instant"
        screening_rec.prompt_version = "v2.0"
        screening_rec.evaluated_at = now
    else:
        screening_rec = ApplicationScreening(
            application_id=application_id,
            skills_match=llm_output.skills_match,
            experience_match=llm_output.experience_match,
            education_match=llm_output.education_match,
            keyword_coverage=llm_output.keyword_coverage,
            match_score=match_score,
            confidence=llm_output.confidence,
            data_quality_flag=llm_output.data_quality_flag,
            evidence=evidence_json,
            fit_flags=fit_flags_json,
            weights_used=weights_json,
            model_used="llama-3.1-8b-instant",
            prompt_version="v2.0",
            evaluated_at=now
        )
        db.add(screening_rec)

    # Update Denormalized Cached Field on Application
    app.match_score = match_score
    app.current_status = current_status
    app.disposition = disposition

    db.commit()
    db.refresh(screening_rec)
    db.refresh(app)

    # 6. Construct Response Detail
    return ScreeningEvaluationDetail(
        skills_match=llm_output.skills_match,
        experience_match=llm_output.experience_match,
        education_match=llm_output.education_match,
        keyword_coverage=llm_output.keyword_coverage,
        confidence=llm_output.confidence,
        match_score=match_score,
        weights_used=weights,
        evidence=llm_output.evidence,
        fit_flags=llm_output.fit_flags,
        data_quality_flag=llm_output.data_quality_flag,
        model_used="llama-3.1-8b-instant",
        prompt_version="v2.0",
        evaluated_at=now
    )
