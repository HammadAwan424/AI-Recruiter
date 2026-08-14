export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer_approval"
  | "offer_sent"
  | "hired"
  | "rejected";

export interface EvidenceItem {
  requirement: string;
  resume_evidence: string;
}

export interface EvidenceBlock {
  matched: EvidenceItem[];
  missing: string[];
}

export interface EvidenceSet {
  skills_match: EvidenceBlock;
  experience_match: EvidenceBlock;
  education_match: EvidenceBlock;
  keyword_coverage: EvidenceBlock;
}

export type FitFlagCategory =
  | "overqualified"
  | "underqualified"
  | "employment_gap"
  | "frequent_job_changes"
  | "career_pivot"
  | "salary_expectation_risk";

export interface FitFlag {
  flag: FitFlagCategory;
  rationale: string;
}

export interface ApplicationScreeningDetail {
  id?: number;
  application_id?: number;
  skills_match: number;
  experience_match: number;
  education_match: number;
  keyword_coverage: number;
  match_score: number;
  confidence: number;
  data_quality_flag?: string;
  evidence: EvidenceSet | string;
  fit_flags?: FitFlag[] | string;
  weights_used?: string | Record<string, number>;
  model_used?: string;
  prompt_version?: string;
  evaluated_at?: string;
}

export interface ApplicationItem {
  id: number;
  candidate_id: number;
  job_id: number;
  cv_text?: string;
  cv_pdf_path?: string;
  gmail_message_id?: string;
  received_at?: string;
  parsed_profile?: string;
  stage?: string;
  offer?: any;
  candidate?: any;
  job?: any;
  fit_flags?: any;
  current_status: ApplicationStatus;
  disposition: string;
  match_score?: number;
  final_score?: number;
  screening?: ApplicationScreeningDetail;
  created_by?: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  interviews?: Array<{
    id: number;
    application_id: number;
    scheduled_date: string;
    scheduled_time: string;
    duration_minutes: number;
    meeting_type: string;
    meeting_link: string;
    status: string;
    notes?: string;
    created_at: string;
    updated_at: string;
  }>;
}

export type ApplicationListItem = ApplicationItem;
export type CandidateApplication = ApplicationItem;

export interface FetchApplicationsResponse {
  message: string;
  job_id: number;
  company_id: number;
  total_fetched: number;
  total_saved: number;
  new_applications: number;
  renewed_applications: number;
  classified_count: number;
  unmatched_count: number;
  failed_upsert_count: number;
  job_summaries: Array<{
    job_id: number;
    total_saved: number;
    new_applications: number;
    renewed_applications: number;
    failed_upserts: number;
  }>;
}

export interface ApplicationDetail {
  id: number;
  candidate_id: number;
  job_id: number;
  received_at?: string;
  parsed_profile?: string;
  current_status: ApplicationStatus;
  disposition: string;
  final_score?: number;
  created_at: string;
  updated_at: string;
  candidate?: any;
  job?: any;
  screening?: ApplicationScreeningDetail & {
    cv_pdf_path?: string;
    cv_text?: string;
  };
  interviews: Array<{
    id: number;
    scheduled_date?: string;
    scheduled_time?: string;
    duration_minutes: number;
    meeting_type: string;
    meeting_link: string;
    status: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    interviewer_assignments?: Array<{
      interviewer_id: number;
      interviewer: {
        id: number;
        full_name: string;
        email: string;
      };
      feedback?: {
        id: number;
        technical_score: number;
        communication_score: number;
        notes?: string;
        created_at?: string;
      };
    }>;
  }>;
  offer?: {
    id: number;
    base_salary: number;
    bonus_equity?: string;
    start_date?: string;
    expiry_date?: string;
    offer_letter_text: string;
    signature_type?: string;
    signer_name?: string;
    signed_at?: string;
    decline_reason?: string;
    audit_hash?: string;
  };
  comments?: Array<{
    id: number;
    application_id: number;
    author_id: number;
    author_name?: string;
    content: string;
    created_at: string;
  }>;
}

export interface CandidateItem {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  applications?: ApplicationItem[];
}
