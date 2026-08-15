from typing import List, Dict, Any
from app.models.interview import InterviewFeedback

AI_MATCH_WEIGHT = 0.4
TECHNICAL_WEIGHT = 0.4
COMMUNICATION_WEIGHT = 0.2


def evaluate_category(final: float) -> str:
    return (
        "Strong Hire" if final >= 80 else
        "Hire" if final >= 65 else
        "Consider" if final >= 50 else
        "Reject"
    )

def calculate_final_score(
    ai_match_score: float,
    technical_score: float,
    communication_score: float,
) -> float:
    """Calculate the canonical 0-100 candidate score used across the product."""
    ai_match = min(100.0, max(0.0, ai_match_score))
    technical = min(100.0, max(0.0, technical_score))
    communication = min(100.0, max(0.0, communication_score))
    return round(
        (AI_MATCH_WEIGHT * ai_match)
        + (TECHNICAL_WEIGHT * technical)
        + (COMMUNICATION_WEIGHT * communication),
        2,
    )


def evaluate_candidate(
    interview_feedbacks: List[InterviewFeedback],
    ai_match_score: float = 0.0,
) -> Dict[str, Any]:
    if not interview_feedbacks:
        avg_tech_100 = 0.0
        avg_comm_100 = 0.0
    else:
        avg_tech_100 = (sum(f.technical_score for f in interview_feedbacks) / len(interview_feedbacks)) * 10
        avg_comm_100 = (sum(f.communication_score for f in interview_feedbacks) / len(interview_feedbacks)) * 10

    final = calculate_final_score(
        ai_match_score=ai_match_score,
        technical_score=avg_tech_100,
        communication_score=avg_comm_100,
    )

    return {
        "final_score": final,
        "category": evaluate_category(final),
    }

def rank_candidates(job_id: int, candidates: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Synchronous candidate list ranking function mirroring ranking_agent behavior.
    Sorts candidate applications by final_score descending, assigns 1-N ranks,
    applies evaluation categories, and extracts the top candidate.
    """
    if not candidates:
        return {"job_id": job_id, "ranked_list": [], "best_candidate": {}}

    # Sort candidates descending by final_score
    sorted_candidates = sorted(
        candidates,
        key=lambda x: x.get("final_score", 0) or 0,
        reverse=True
    )

    ranked_list = []
    for i, candidate in enumerate(sorted_candidates):
        score = candidate.get("final_score", 0) or 0
        category = evaluate_category(score)
        ranked_list.append({
            **candidate,
            "rank": i + 1,
            "ranking_category": category
        })

    best_candidate = ranked_list[0] if ranked_list else {}

    return {
        "job_id": job_id,
        "ranked_list": ranked_list,
        "best_candidate": best_candidate
    }
