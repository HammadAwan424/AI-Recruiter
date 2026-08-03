import { PermissionKey } from "../../shared/types/role.types";

export const INTERVIEW_PERMISSIONS = {
  CREATE: "interview:create" as PermissionKey,
  ASSIGN: "interview:assign" as PermissionKey,
  SUBMIT_FEEDBACK: "interview:submit_feedback" as PermissionKey,
  RESCHEDULE: "interview:reschedule" as PermissionKey,
} as const;
