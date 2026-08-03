import { PermissionKey } from "./role.types";
import { JobPost } from "./job.types";

export type UserRole =
  | "superadmin"
  | "ceo"
  | "hr_manager"
  | "recruiter"
  | "hiring_manager"
  | "interviewer"
  | "employee";

export interface CompanyUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: UserRole;
  department?: string;
  status: "active" | "inactive" | "fired" | string;
  joining_date?: string;
  permissions?: PermissionKey[];
}

export interface UserDetail extends CompanyUser {
  permissions: PermissionKey[];
  assigned_jobs: JobPost[];
}

export interface CompanyUsersResponse {
  company_id: number;
  total_users: number;
  users: CompanyUser[];
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
