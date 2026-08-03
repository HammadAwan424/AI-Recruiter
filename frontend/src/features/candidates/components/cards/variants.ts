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

export function resolveCardVariant(candidate: any, stageKey: string): CandidateCardVariant {
  const isRejected = candidate.disposition === "rejected" || candidate.rejected || candidate.status === "rejected";

  if (stageKey === "hired") {
    return { stage: "hired", variant: "normal" };
  }

  if (stageKey === "interview") {
    const interviewsList = candidate.interviews || [];
    const isCompleted =
      candidate.interview_status === "COMPLETED" ||
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
 * Higher-order function that returns a stage-specific draggability evaluator.
 * - hired / offer_sent: returns false (no arguments required)
 * - interview: returns true ONLY if variant == "interview_completed"
 * - applied / screening / offer_approval: returns false if variant == "rejected"
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
