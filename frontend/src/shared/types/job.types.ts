import type { UserResponse } from "./user.types";

export type JobStatus = "published" | "pending_approval";

export interface JobDistribution {
  id: number;
  job_id: number;
  board: string;
  status: "pending" | "posted" | "failed" | string;
  external_ref?: string | null;
  error?: string | null;
  created_at?: string;
}

export interface JobMinimalResponse {
  id: number;
  title: string;
  department?: string | null;
}

export interface JobResponse {
  id: number;
  company_id: number;
  title: string;
  department?: string | null;
  employment_type?: string | null;
  experience?: string | null;
  skills?: string | null;
  salary_range?: string | null;
  full_description?: string | null;
  keywords?: string | null;
  status: JobStatus;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
  // UI enrichment & backend joins
  company_name?: string;
  description?: string; // fallback alias for full_description
  distributions?: JobDistribution[];
  hiring_manager_id?: number | null;
  hiring_manager_name?: string;
  recruiter_ids?: number[];
  recruiter_names?: string[];
  last_read?: string;
}

/**
 * JobPost is an alias of JobResponse for backward compatibility.
 */
export type JobPost = JobResponse;

export interface JobDetail extends JobResponse {
  creator?: UserResponse | null;
  assigned_users: UserResponse[];
}

export interface JobCreatePayload {
  title: string;
  department?: string;
  employment_type?: string;
  experience?: string;
  skills?: string;
  salary_range?: string;
  full_description?: string;
  keywords?: string;
  status?: JobStatus;
  hiring_manager_id?: number | null;
  recruiter_ids?: number[];
  interviewer_ids?: number[];
  boards?: string[];
  additional_info?: string;
}

export type JobUpdatePayload = Partial<JobCreatePayload>;

export interface JobsListResponse {
  total: number;
  jobs: JobResponse[];
}

export interface PublicJobItem {
  id: number;
  title: string;
  department?: string | null;
  employment_type?: string | null;
  experience?: string | null;
  skills?: string | null;
  salary_range?: string | null;
  company_name?: string;
  full_description?: string | null;
  created_at?: string;
}

export interface PublicJobsResponse {
  total: number;
  jobs: PublicJobItem[];
}

export interface GenerateJDPayload {
  title: string;
  department: string;
  employment_type: string;
  experience: string;
  skills: string;
  salary_range?: string;
  additional_info?: string;
}

export interface GenerateJDResponse {
  full_description: string;
  keywords: string;
}
