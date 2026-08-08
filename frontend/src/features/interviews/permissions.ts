import { PermissionKey } from "../../shared/types/role.types";

export const INTERVIEW_PERMISSIONS = {
  VIEW: "interview:view" as PermissionKey,
  CREATE: "interview:create" as PermissionKey,
  SUBMIT_FEEDBACK: "interview:submit_feedback" as PermissionKey,
  RESCHEDULE: "interview:reschedule" as PermissionKey,
} as const;
