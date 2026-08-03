import { PermissionKey } from "../../shared/types/role.types";

export const OFFER_PERMISSIONS = {
  GENERATE: "offer:generate" as PermissionKey,
  APPROVE: "offer:approve" as PermissionKey,
  VIEW: "offer:view" as PermissionKey,
} as const;
