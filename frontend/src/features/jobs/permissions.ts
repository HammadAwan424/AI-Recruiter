import { PermissionKey } from "../../shared/types/role.types";

export const JOB_PERMISSIONS = {
  CREATE: "job:create" as PermissionKey,
  APPROVE: "job:approve" as PermissionKey,
  CLOSE: "job:close" as PermissionKey,
  ASSIGN_RECRUITER: "job:assign_recruiter" as PermissionKey,
  VIEW: "job:view" as PermissionKey,
} as const;
