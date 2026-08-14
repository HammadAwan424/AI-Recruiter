import {
  ApplicationListItem,
  ApplicationDetail,
  CandidateApplication,
  EvaluationStage,
} from "../../../shared/types/candidate.types";

export type { EvaluationStage };

export type CardBadgeVariant =
  | "pending"
  | "parsed"
  | "screened"
  | "unassigned"
  | "scheduled"
  | "completed"
  | "hired"
  | "rejected";

export interface CandidateCardBadge {
  label: string;
  variant: CardBadgeVariant;
  tooltip: string;
  colorTheme: "amber" | "cyan" | "emerald" | "red" | "zinc";
}

export interface CandidateCardDescriptor {
  // Score details
  scoreLabel: "AI Score" | "Score";
  score: number | null;
  scoreDisplay: string;
  scoreTooltip: string;

  // Lifecycle & Evaluation flags
  isScreened: boolean;
  isParsed: boolean;
  isPending: boolean;
  hasCompletedInterview: boolean;
  hasAssignedInterviewer: boolean;

  // Interview counts & progress
  showInterviewsCount: boolean;
  interviewsLabel: "Remaining" | "Interviews";
  completedInterviewsCount: number;
  totalInterviewsCount: number;
  remainingInterviewsCount: number;
  interviewsDisplay: string;
  interviewsTooltip: string;

  // Unified Badge (null if no badge is needed)
  badge: CandidateCardBadge | null;
  stage: EvaluationStage;

  // Status flags
  isRejected: boolean;
  isHired: boolean;
}

/**
 * Centralized evaluation, score label, interview count, and status badge resolver.
 * Single source of truth for all candidate card variants and views.
 *
 * Rules:
 * 1. Score Label: "Score" for cards with >= 1 completed interview, "AI Score" otherwise.
 * 2. Status Badges:
 *    - "Screened" and "Completed" badges are removed.
 *    - Only "Unassigned" receives explicit emphasis in interview stage.
 *    - "Pending" and "Parsed" remain for un-evaluated applications.
 * 3. Interviews Field:
 *    - When interviews are remaining: shows "Remaining m/n"
 *    - When all interviews are completed: shows "Interviews n/n"
 *    - Hidden for unassigned candidates.
 */
export function getCandidateCardDescriptor(
  candidate: CandidateApplication | ApplicationListItem | ApplicationDetail | any,
  stageKey?: string
): CandidateCardDescriptor {
  const isRejected = Boolean(
    candidate?.disposition === "rejected" ||
    candidate?.rejected ||
    candidate?.status === "rejected"
  );
  const isHired = Boolean(
    candidate?.current_status === "hired" ||
    candidate?.hired ||
    stageKey === "hired"
  );

  const interviewsList: any[] = candidate?.interviews || [];
  const hasCompletedInterview = Boolean(
    candidate?.interview_status === "COMPLETED" ||
    candidate?.current_status === "interview_completed" ||
    (interviewsList.length > 0 && interviewsList.some((i) => i.status === "COMPLETED")) ||
    (candidate?.interviewer_feedback && candidate.interviewer_feedback.length > 0)
  );

  const hasAssignedInterviewer = Boolean(
    (candidate?.interviewer_1 && candidate.interviewer_1 !== "—" && candidate.interviewer_1.trim() !== "") ||
    (candidate?.interviewer_2 && candidate.interviewer_2 !== "—" && candidate.interviewer_2.trim() !== "") ||
    (interviewsList.length > 0)
  );

  // 1. Centralized Score Label Decision: "Score" if >= 1 interview completed, else "AI Score"
  const scoreLabel: "AI Score" | "Score" = hasCompletedInterview ? "Score" : "AI Score";

  // 2. Score Value Resolution
  const rawScore =
    candidate?.final_score ??
    candidate?.interview_score ??
    candidate?.match_score ??
    candidate?.screening?.match_score;
  const isScreened = rawScore != null && !isNaN(Number(rawScore));
  const numericScore = isScreened ? Number(rawScore) : null;
  const scoreDisplay = numericScore != null ? `${numericScore.toFixed(1)}%` : "—";

  const hasParsedProfile = Boolean(
    candidate?.parsed_profile || candidate?.profile || candidate?.has_parsed_profile
  );
  const isParsed = hasParsedProfile || isScreened;
  const isPending = !isParsed && !isScreened;

  // Evaluation stage
  const stage: EvaluationStage = isScreened ? "screened" : isParsed ? "parsed" : "pending";

  // Score tooltip
  const scoreTooltip = hasCompletedInterview
    ? `Final candidate evaluation score (${scoreDisplay}) including interview round assessment.`
    : isScreened
    ? `AI screening match score (${scoreDisplay}) against requisition criteria.`
    : isParsed
    ? "Resume parsed into structured profile. Awaiting AI match scoring."
    : "Application received. Pending resume parsing and AI evaluation.";

  // 3. Centralized Badge Resolution (Screened and Completed badges omitted; Unassigned emphasized)
  let badge: CandidateCardBadge | null = null;

  if (isRejected) {
    badge = {
      label: "Rejected",
      variant: "rejected",
      colorTheme: "red",
      tooltip: "Candidate application marked as rejected.",
    };
  } else if (isHired) {
    badge = {
      label: "Hired",
      variant: "hired",
      colorTheme: "emerald",
      tooltip: "Candidate successfully hired for this requisition.",
    };
  } else if (stageKey === "interview" || candidate?.current_status === "interview") {
    // In interview stage, only unassigned candidates receive badge emphasis
    if (!hasCompletedInterview && !hasAssignedInterviewer) {
      badge = {
        label: "Unassigned",
        variant: "unassigned",
        colorTheme: "amber",
        tooltip: "Awaiting interview slot scheduling & interviewer assignment.",
      };
    }
  } else if (!isScreened) {
    if (isParsed) {
      badge = {
        label: "Parsed",
        variant: "parsed",
        colorTheme: "cyan",
        tooltip: "Resume profile extracted. Awaiting AI match scoring.",
      };
    } else {
      badge = {
        label: "Pending",
        variant: "pending",
        colorTheme: "amber",
        tooltip: "Application received via Gmail. Pending resume parsing and AI evaluation.",
      };
    }
  }

  // 4. Centralized Interview Counts Resolution
  // Only show interview progress if interview rounds have actually been scheduled/completed
  const showInterviewsCount = Boolean(
    interviewsList.length > 0 ||
    hasCompletedInterview ||
    (hasAssignedInterviewer && (stageKey === "interview" || candidate?.current_status === "interview"))
  );

  let completedInterviewsCount = 0;
  let totalInterviewsCount = 0;

  if (interviewsList.length > 0) {
    totalInterviewsCount = interviewsList.length;
    completedInterviewsCount = interviewsList.filter((i) => i.status === "COMPLETED").length;
  } else if (candidate?.interview_status === "COMPLETED" || candidate?.current_status === "interview_completed") {
    totalInterviewsCount = 1;
    completedInterviewsCount = 1;
  } else if (hasAssignedInterviewer) {
    totalInterviewsCount = 1;
    completedInterviewsCount = 0;
  }

  const remainingInterviewsCount = Math.max(0, totalInterviewsCount - completedInterviewsCount);
  const interviewsLabel: "Remaining" | "Interviews" = remainingInterviewsCount > 0 ? "Remaining" : "Interviews";

  const interviewsDisplay = showInterviewsCount && totalInterviewsCount > 0
    ? (remainingInterviewsCount > 0 ? `${remainingInterviewsCount}/${totalInterviewsCount}` : `${completedInterviewsCount}/${totalInterviewsCount}`)
    : "—";

  const interviewsTooltip = showInterviewsCount && totalInterviewsCount > 0
    ? (remainingInterviewsCount > 0
        ? `${remainingInterviewsCount} of ${totalInterviewsCount} interview round(s) remaining (${completedInterviewsCount} completed)`
        : `All ${totalInterviewsCount} interview round(s) completed`)
    : "No interview rounds scheduled";

  return {
    scoreLabel,
    score: numericScore,
    scoreDisplay,
    scoreTooltip,
    isScreened,
    isParsed,
    isPending,
    hasCompletedInterview,
    hasAssignedInterviewer,
    showInterviewsCount,
    interviewsLabel,
    completedInterviewsCount,
    totalInterviewsCount,
    remainingInterviewsCount,
    interviewsDisplay,
    interviewsTooltip,
    badge,
    stage,
    isRejected,
    isHired,
  };
}

/**
 * Legacy compatibility wrapper for getCandidateEvaluationStatus
 */
export function getCandidateEvaluationStatus(
  candidate: CandidateApplication | ApplicationListItem | ApplicationDetail | any
) {
  const desc = getCandidateCardDescriptor(candidate);
  return {
    stage: desc.stage,
    isScreened: desc.isScreened,
    isParsed: desc.isParsed,
    isPending: desc.isPending,
    score: desc.score,
    scoreDisplay: desc.scoreDisplay,
    badgeLabel: desc.badge?.label || "",
    badgeVariant: desc.badge?.variant || "screened",
    tooltip: desc.badge?.tooltip || "",
  };
}

/**
 * Helper to determine if an application requires resume parsing.
 */
export function requiresParsing(
  candidate: CandidateApplication | ApplicationListItem | ApplicationDetail | any
): boolean {
  if (!candidate || candidate.disposition === "rejected") return false;
  const desc = getCandidateCardDescriptor(candidate);
  return !desc.isParsed;
}

/**
 * Helper to determine if an application requires AI screening.
 */
export function requiresScreening(
  candidate: CandidateApplication | ApplicationListItem | ApplicationDetail | any
): boolean {
  if (!candidate || candidate.disposition === "rejected") return false;
  const desc = getCandidateCardDescriptor(candidate);
  return !desc.isScreened;
}
