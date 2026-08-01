export type PermissionKey =
  | "*"
  | "user:change_permissions"
  | "user:invite"
  | "user:deactivate"
  | "user:view"
  | "job:create"
  | "job:approve"
  | "job:close"
  | "job:assign_recruiter"
  | "job:view"
  | "candidate:view_compensation"
  | "candidate:disposition"
  | "candidate:view"
  | "interview:create"
  | "interview:assign"
  | "interview:submit_feedback"
  | "interview:reschedule"
  | "offer:generate"
  | "offer:approve"
  | "offer:view"
  | "profile:update";

export interface Role {
  id: number;
  name: string;
  company_id: number | null;
  description?: string;
  permissions: PermissionKey[];
}

export interface RolesListResponse {
  company_id: number;
  roles: Role[];
}

export interface RolePermissionUpdatePayload {
  permission_keys: PermissionKey[];
}
