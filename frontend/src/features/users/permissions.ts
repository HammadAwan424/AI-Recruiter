import { PermissionKey } from "../../shared/types/role.types";

export const USER_PERMISSIONS = {
  CHANGE_PERMISSIONS: "user:change_permissions" as PermissionKey,
  INVITE: "user:invite" as PermissionKey,
  DEACTIVATE: "user:deactivate" as PermissionKey,
  VIEW: "user:view" as PermissionKey,
} as const;
