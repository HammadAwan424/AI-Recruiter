export interface JobPost {
  id: number;
  title: string;
  department: string;
  employment_type: string;
  experience: string;
  salary_range: string;
  skills: string;
  description?: string;
  full_description?: string;
  additional_info?: string;
  created_at?: string;
  company_id?: number;
  keywords?: string;
}

export interface JobCreatePayload {
  title: string;
  department: string;
  employment_type: string;
  experience: string;
  salary_range: string;
  skills: string;
  additional_info?: string;
}

export interface JobsListResponse {
  jobs: JobPost[];
  total?: number;
}
