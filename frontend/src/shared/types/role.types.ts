import { UserRole } from "./auth.types";

export type PermissionKey =
  | "*"
  | "user:"
  | "job:"
  | "candidate:"
  | "interview:"
  | "offer:"
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
  | "interview:view"
  | "interview:create"
  | "interview:submit_feedback"
  | "interview:reschedule"
  | "offer:generate"
  | "offer:approve"
  | "offer:view"
  | "profile:update"
  | (string & {});

export type JobScope = "own" | "all";

export interface RoleBase {
  name: UserRole;
  description?: string | null;
  job_scope: JobScope;
}

export interface RoleResponse extends RoleBase {
  id: number;
  company_id: number | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: string;
  updated_at?: string;
  permissions: PermissionKey[];
}

export type Role = RoleResponse;

export interface RolesListResponse {
  company_id: number | null;
  roles: RoleResponse[];
}

export interface RolePermissionUpdatePayload {
  permission_keys: PermissionKey[];
  job_scope?: JobScope;
}
