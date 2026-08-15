import unittest
from types import SimpleNamespace

from app.utils.candidate_evaluation import calculate_final_score, evaluate_candidate


class CandidateEvaluationTests(unittest.TestCase):
    def test_returns_final_score_key_used_by_scorecard_submission(self):
        feedback = SimpleNamespace(technical_score=8.0, communication_score=8.0)

        result = evaluate_candidate([feedback], ai_match_score=80.0)

        self.assertEqual(result["final_score"], 80.0)
        self.assertEqual(result["category"], "Strong Hire")
        self.assertNotIn("final", result)

    def test_final_score_uses_the_documented_ai_and_interview_weights(self):
        score = calculate_final_score(
            ai_match_score=0.8,
            technical_score=85.0,
            communication_score=80.0,
        )

        self.assertEqual(score, 50.32)


if __name__ == "__main__":
    unittest.main()
