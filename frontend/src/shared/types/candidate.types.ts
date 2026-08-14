import type { InterviewResponse, InterviewDetail } from "./interview.types";
import type { OfferResponse } from "./offer.types";
import type { JobMinimalResponse } from "./job.types";

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offer_approval"
  | "offer_sent"
  | "hired";

export type ApplicationDisposition = "active" | "rejected";

export type EvaluationStage = "pending" | "parsed" | "screened";
export type CandidateEvaluationStage = EvaluationStage;

export interface CandidateMinimalResponse {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
}

export type CandidateSummary = CandidateMinimalResponse;

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

export interface ScreeningDimensionWeights {
  skills_match: number;
  experience_match: number;
  education_match: number;
  keyword_coverage: number;
}

export interface ApplicationScreeningResponse {
  id?: number;
  application_id?: number;
  skills_match: number;
  experience_match: number;
  education_match: number;
  keyword_coverage: number;
  match_score: number;
  confidence: number;
  data_quality_flag?: string | null;
  evidence: EvidenceSet | string;
  fit_flags?: FitFlag[] | string;
  weights_used?: ScreeningDimensionWeights | string | Record<string, number>;
  model_used?: string;
  prompt_version?: string;
  evaluated_at?: string;
  cv_pdf_path?: string | null;
  cv_text?: string | null;
}

export type ApplicationScreeningDetail = ApplicationScreeningResponse;

export interface ScreeningEvaluationDetail {
  skills_match: number;
  experience_match: number;
  education_match: number;
  keyword_coverage: number;
  confidence: number;
  match_score: number;
  weights_used: ScreeningDimensionWeights;
  evidence: EvidenceSet;
  fit_flags: FitFlag[];
  data_quality_flag?: string | null;
  model_used: string;
  prompt_version: string;
  evaluated_at: string;
}

export interface WorkHistoryEntry {
  title: string;
  company: string;
  start_date: string;
  end_date: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface ParsingLLMOutput {
  skills: string[];
  work_history: WorkHistoryEntry[];
  education: EducationEntry[];
  certifications: string[];
  needs_review: boolean;
  review_reason?: string | null;
}

export interface ParsedResumeProfile {
  schema_version: "extraction.parsed_resume_profile.v1";
  source_name: string;
  profile: ParsingLLMOutput;
}

export interface CommentResponse {
  id: number;
  application_id: number;
  author_id: number;
  author_name?: string | null;
  content: string;
  created_at: string;
}

export interface CommentCreatePayload {
  content: string;
}

export interface ApplicationResponse {
  id: number;
  candidate_id: number;
  job_id: number;
  cv_text?: string | null;
  cv_pdf_path?: string | null;
  gmail_account_id?: number | null;
  gmail_message_id?: string | null;
  received_at?: string | null;
  parsed_profile?: ParsedResumeProfile | string | null;
  current_status: ApplicationStatus;
  disposition: ApplicationDisposition;
  match_score?: number | null;
  final_score?: number | null;
  screening?: ApplicationScreeningResponse | null;
  candidate?: CandidateMinimalResponse | null;
  job?: JobMinimalResponse | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
  // UI legacy compatibility
  stage?: string;
  candidate_name?: string;
  candidate_email?: string;
  job_title?: string;
  fit_flags?: any;
}

export interface ApplicationListItem extends ApplicationResponse {
  interviews: InterviewResponse[];
}

/**
 * ApplicationItem & CandidateApplication are aliases for ApplicationListItem.
 */
export type ApplicationItem = ApplicationListItem;
export type CandidateApplication = ApplicationListItem;

export interface ApplicationDetail extends ApplicationResponse {
  interviews: InterviewDetail[];
  comments: CommentResponse[];
  offer?: OfferResponse | null;
}

export interface JobApplicationSyncSummary {
  job_id: number;
  total_saved: number;
  new_applications: number;
  renewed_applications: number;
  failed_upserts: number;
}

export interface FetchApplicationsResponse {
  message: string;
  job_id: number;
  company_id: number;
  total_fetched: number;
  total_saved: number;
  new_applications: number;
  renewed_applications: number;
  new_application_ids?: number[];
  renewed_application_ids?: number[];
  classified_count: number;
  unmatched_count: number;
  failed_upsert_count: number;
  job_summaries: JobApplicationSyncSummary[];
}

export interface CandidateItem {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  created_at: string;
  updated_at: string;
  applications?: ApplicationListItem[];
}

export interface ApplicationUpdatePayload {
  current_status?: ApplicationStatus;
  disposition?: ApplicationDisposition;
}
