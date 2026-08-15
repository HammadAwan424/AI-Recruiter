export const CANDIDATE_SCORE_WEIGHTS = {
  aiMatch: 0.4,
  technical: 0.4,
  communication: 0.2,
} as const;

export interface InterviewScoreInput {
  technical_score: number;
  communication_score: number;
}

export interface CandidateScoreBreakdown {
  finalScore: number;
  aiMatchScore: number;
  averageTechnicalScore: number;
  averageCommunicationScore: number;
}

const clampPercentage = (value: number | null | undefined): number => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.min(100, Math.max(0, numericValue)) : 0;
};

/** Mirrors the backend's canonical 40% AI / 40% technical / 20% communication score. */
export const calculateCandidateScore = (
  aiMatchScore: number | null | undefined,
  feedbacks: InterviewScoreInput[]
): CandidateScoreBreakdown => {
  const validFeedbacks = feedbacks.filter(
    (feedback) =>
      Number.isFinite(Number(feedback.technical_score)) &&
      Number.isFinite(Number(feedback.communication_score))
  );
  const averageTechnicalScore = validFeedbacks.length
    ? clampPercentage(
        (validFeedbacks.reduce((total, feedback) => total + Number(feedback.technical_score), 0) /
          validFeedbacks.length) *
          10
      )
    : 0;
  const averageCommunicationScore = validFeedbacks.length
    ? clampPercentage(
        (validFeedbacks.reduce((total, feedback) => total + Number(feedback.communication_score), 0) /
          validFeedbacks.length) *
          10
      )
    : 0;
  const normalizedAiMatchScore = clampPercentage(aiMatchScore);
  const finalScore = Number(
    (
      normalizedAiMatchScore * CANDIDATE_SCORE_WEIGHTS.aiMatch +
      averageTechnicalScore * CANDIDATE_SCORE_WEIGHTS.technical +
      averageCommunicationScore * CANDIDATE_SCORE_WEIGHTS.communication
    ).toFixed(2)
  );

  return {
    finalScore,
    aiMatchScore: normalizedAiMatchScore,
    averageTechnicalScore,
    averageCommunicationScore,
  };
};
