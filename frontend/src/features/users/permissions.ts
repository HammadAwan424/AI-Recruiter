import { PermissionKey } from "../../shared/types/role.types";

export const USER_PERMISSIONS = {
  CHANGE_PERMISSIONS: "change_permissions" as PermissionKey,
  SUPERADMIN: "superadmin" as PermissionKey,
} as const;
