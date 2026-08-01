import { PermissionKey } from "../../shared/types/role.types";

export const CANDIDATE_PERMISSIONS = {
  VIEW_COMPENSATION: "candidate:view_compensation" as PermissionKey,
  DISPOSITION: "candidate:disposition" as PermissionKey,
  VIEW: "candidate:view" as PermissionKey,
} as const;
