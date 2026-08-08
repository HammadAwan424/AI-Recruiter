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

export interface Role {
  id: number;
  name: string;
  company_id: number | null;
  description?: string;
  job_scope: JobScope;
  permissions: PermissionKey[];
}

export interface RolesListResponse {
  company_id: number;
  roles: Role[];
}

export interface RolePermissionUpdatePayload {
  permission_keys: PermissionKey[];
  job_scope?: JobScope;
}
