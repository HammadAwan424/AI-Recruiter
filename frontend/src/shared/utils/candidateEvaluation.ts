import { ApplicationStatus } from "../types/candidate.types";

export type PipelineStageKey =
  | "applied"
  | "screening"
  | "interview"
  | "offer_approval"
  | "offer_sent"
  | "hired";

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

export type PermissionChecker = (permissionKey: string) => boolean;

export interface CandidateEvaluationInput {
  current_status?: ApplicationStatus | string;
  status?: ApplicationStatus | string;
  stage?: PipelineStageKey | string;
  disposition?: string;
  rejected?: boolean;
  interview_status?: string;
  interviews?: Array<{ status: string }>;
  interviewer_assignments?: any[];
  interviewer_1?: any;
}

/**
 * Helper to create a PermissionChecker from a raw string array at the point of usage.
 */
export function createPermissionChecker(permissions: string[]): PermissionChecker {
  return (permKey: string): boolean => {
    if (permissions.includes("*") || permissions.includes(permKey)) return true;
    return permissions.some((p) => permKey.startsWith(p) || p.startsWith(permKey));
  };
}

/**
 * Resolves the card variant for any candidate given their stage key.
 */
export function resolveCardVariant(
  candidate: CandidateEvaluationInput,
  stageKey: PipelineStageKey
): CandidateCardVariant {
  const isRejected = candidate.disposition === "rejected" || candidate.rejected || candidate.status === "rejected";

  if (stageKey === "hired") {
    return { stage: "hired", variant: "normal" };
  }

  if (stageKey === "interview") {
    const interviewsList = candidate.interviews || [];
    const isCompleted =
      candidate.interview_status === "COMPLETED" ||
      candidate.current_status === "interview_completed" ||
      (interviewsList.length > 0 && interviewsList.every((i) => i.status === "COMPLETED"));

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

  switch (stageKey) {
    case "applied":
      return { stage: "applied", variant };
    case "screening":
      return { stage: "screening", variant };
    case "offer_approval":
      return { stage: "offer_approval", variant };
    case "offer_sent":
      return { stage: "offer_sent", variant };
    default:
      return { stage: "applied", variant };
  }
}

/**
 * Single evaluation entrypoint handling stage state & RBAC permissions for draggability across all 6 stages.
 * Mandatory parameters: candidate (CandidateEvaluationInput), stageKey (PipelineStageKey), hasPermission (PermissionChecker).
 */
export function getDraggableEvaluator(
  candidate: CandidateEvaluationInput,
  stageKey: PipelineStageKey,
  hasPermission: PermissionChecker
): boolean {
  const isRejected = candidate.disposition === "rejected" || candidate.rejected || candidate.status === "rejected";
  if (isRejected) return false;

  switch (stageKey) {
    case "hired":
    case "offer_sent":
      return false;

    case "interview": {
      // Must have offer:generate permission to initiate offer generation out of interview stage
      if (!hasPermission("offer:generate")) return false;
      const cardVariant = resolveCardVariant(candidate, "interview");
      return cardVariant.variant === "interview_completed";
    }

    case "offer_approval": {
      // Must have offer:approve permission to drag card from Awaiting Approval -> Offer Sent
      if (!hasPermission("offer:approve")) return false;
      return true;
    }

    case "applied":
    case "screening":
    default: {
      // Must have candidate:disposition permission to move candidates out of applied or screening stages
      if (!hasPermission("candidate:disposition")) return false;
      return true;
    }
  }
}

/**
 * Single evaluation entrypoint handling droppability into target stage given source stage & RBAC permissions.
 */
export function getDroppableEvaluator(
  sourceStageKey: PipelineStageKey,
  targetStageKey: PipelineStageKey,
  stages: Array<{ key: string }>,
  hasPermission: PermissionChecker
): boolean {
  if (sourceStageKey === targetStageKey) return false;

  const sourceIdx = stages.findIndex((s) => s.key === sourceStageKey);
  const targetIdx = stages.findIndex((s) => s.key === targetStageKey);
  if (sourceIdx === -1 || targetIdx === -1) return false;

  // Enforce sequential pipeline flow (adjacent stages)
  const isAdjacent = Math.abs(targetIdx - sourceIdx) === 1;
  if (!isAdjacent) return false;

  // Enforce target stage RBAC permissions
  switch (targetStageKey) {
    case "offer_approval":
      return hasPermission("offer:generate");
    case "offer_sent":
      return hasPermission("offer:approve");
    case "hired":
      return hasPermission("offer:approve");
    case "screening":
    case "interview":
    case "applied":
    default:
      return hasPermission("candidate:disposition");
  }
}
