import { CompanyUser } from "./user.types";

export interface JobPost {
  id: number;
  title: string;
  department: string;
  employment_type: string;
  experience: string;
  salary_range: string;
  skills: string;
  status?: string;
  description?: string;
  full_description?: string;
  additional_info?: string;
  created_at?: string;
  company_id?: number;
  keywords?: string;
  last_read?: string;
}

export interface JobDetail extends JobPost {
  creator?: CompanyUser;
  assigned_users: CompanyUser[];
}

export interface JobCreatePayload {
  title: string;
  department: string;
  employment_type: string;
  experience: string;
  salary_range: string;
  skills: string;
  status?: string;
  full_description?: string;
  keywords?: string;
  additional_info?: string;
  hiring_manager_id?: number | null;
  recruiter_ids?: number[];
  interviewer_ids?: number[];
}

export interface JobsListResponse {
  jobs: JobPost[];
  total?: number;
}
