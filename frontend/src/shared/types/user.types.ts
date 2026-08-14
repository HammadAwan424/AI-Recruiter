import { UserRole, UserStatus } from "./auth.types";
import { PermissionKey } from "./role.types";
import type { JobResponse } from "./job.types";

export type { UserRole, UserStatus };

export interface CompanyMinimalResponse {
  id: number;
  name: string;
}

export interface UserResponse {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  company_id?: number | null;
  phone?: string | null;
  department?: string | null;
  joining_date?: string | null;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

/**
 * CompanyUser is an alias of UserResponse for backward compatibility across components.
 */
export type CompanyUser = UserResponse;

export interface UserDetail extends UserResponse {
  company?: CompanyMinimalResponse | null;
  permissions: PermissionKey[];
  assigned_jobs: JobResponse[];
}

export interface CompanyUsersResponse {
  company_id: number | null;
  total_users: number;
  users: UserResponse[];
}

export interface UserCreatePayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  phone?: string;
}

export interface UserRoleUpdatePayload {
  role: UserRole;
}

export interface CEOSignupPayload {
  full_name: string;
  email: string;
  company_name: string;
  password: string;
  confirm_password: string;
}
