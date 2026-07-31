import { PermissionKey } from "../../shared/types/role.types";

export const INTERVIEW_PERMISSIONS = {
  CREATE_INTERVIEW: "create_interview" as PermissionKey,
  TAKE_INTERVIEW: "take_interview" as PermissionKey,
} as const;
