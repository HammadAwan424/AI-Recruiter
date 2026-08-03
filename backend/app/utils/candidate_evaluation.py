from typing import List, Dict, Any
from app.models.interview import InterviewFeedback

def evaluate_category(final: float) -> str:
    return (
        "Strong Hire" if final >= 80 else
        "Hire" if final >= 65 else
        "Consider" if final >= 50 else
        "Reject"
    )

def evaluate_candidate(interview_feedbacks: List[InterviewFeedback], resume_score: float = 0.0) -> Dict[str, Any]:
    if not interview_feedbacks:
        avg_tech_100 = 0.0
        avg_comm_100 = 0.0
    else:
        avg_tech_100 = (sum(f.technical_score for f in interview_feedbacks) / len(interview_feedbacks)) * 10
        avg_comm_100 = (sum(f.communication_score for f in interview_feedbacks) / len(interview_feedbacks)) * 10

    final = round((0.4 * resume_score) + (0.4 * avg_tech_100) + (0.2 * avg_comm_100), 2)

    return {
        "final": final, 
        "category": evaluate_category(final)
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
