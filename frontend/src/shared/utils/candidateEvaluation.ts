export type StandardStageVariant = "normal" | "rejected";
export type InterviewStageVariant = "pending_assignment" | "interview_assigned" | "interview_completed";
export type HiredStageVariant = "normal";

export type CandidateCardVariant =
  | { stage: "applied"; variant: StandardStageVariant }
  | { stage: "screening"; variant: StandardStageVariant }
  | { stage: "interview"; variant: InterviewStageVariant }
  | { stage: "offer_approval"; variant: StandardStageVariant }
  | { stage: "offer_sent"; variant: StandardStageVariant }
  | { stage: "hired"; variant: HiredStageVariant };

/**
 * Resolves the card variant for any candidate given their stage key.
 */
export function resolveCardVariant(candidate: any, stageKey: string): CandidateCardVariant {
  const isRejected = candidate.disposition === "rejected" || candidate.rejected || candidate.status === "rejected";

  if (stageKey === "hired") {
    return { stage: "hired", variant: "normal" };
  }

  if (stageKey === "interview") {
    const interviewsList = candidate.interviews || [];
    const isCompleted =
      candidate.interview_status === "COMPLETED" ||
      candidate.current_status === "interview_completed" ||
      (interviewsList.length > 0 && interviewsList.every((i: any) => i.status === "COMPLETED"));

    const hasInterviewers = Boolean(
      (candidate.interviewer_assignments && candidate.interviewer_assignments.length > 0) ||
      candidate.interviewer_1 ||
      interviewsList.length > 0
    );

    if (isCompleted) {
      return { stage: "interview", variant: "interview_completed" };
    }
    if (hasInterviewers) {
      return { stage: "interview", variant: "interview_assigned" };
    }
    return { stage: "interview", variant: "pending_assignment" };
  }

  const variant: StandardStageVariant = isRejected ? "rejected" : "normal";
  return { stage: stageKey as any, variant };
}

/**
 * Returns a stage-specific draggability evaluator function.
 */
export function getDraggableEvaluator(stageKey: string): (variant?: string) => boolean {
  switch (stageKey) {
    case "hired":
    case "offer_sent":
      return () => false;

    case "interview":
      return (variant?: string) => variant === "interview_completed" || variant === "completed";

    case "applied":
    case "screening":
    case "offer_approval":
    default:
      return (variant?: string) => variant !== "rejected";
  }
}

/**
 * Evaluates whether a candidate is a draggable (completed) interview candidate ready for offer creation.
 */
export function isDraggableInterviewCandidate(candidate: any): boolean {
  if (!candidate) return false;
  const isRejected = candidate.disposition === "rejected" || candidate.rejected || candidate.status === "rejected";
  if (isRejected) return false;

  const resolved = resolveCardVariant(candidate, "interview");
  const evaluator = getDraggableEvaluator("interview");

  // Candidate is draggable if their interview variant evaluates to true
  return evaluator(resolved.variant);
}
