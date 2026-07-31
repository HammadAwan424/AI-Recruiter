import { PermissionKey } from "../../shared/types/role.types";

export const CANDIDATE_PERMISSIONS = {
  DISPOSITION_CANDIDATE: "disposition_candidate" as PermissionKey,
  VIEW_COMPENSATION: "view_compensation" as PermissionKey,
} as const;
