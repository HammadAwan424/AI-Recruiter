export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "offered"
  | "hired"
  | "rejected";

export interface CandidateApplication {
  application_id: number;
  candidate_id: number;
  full_name: string;
  email: string;
  phone?: string;
  job_id: number;
  job_title?: string;
  rank: number;
  ranking_category: "Strong Hire" | "Hire" | "Consider" | "Reject" | string;
  final_score: number;
  match_score?: number;
  resume_score?: number;
  technical_score?: number;
  communication_score?: number;
  interview_id?: number;
  interview_status?: string;
  interview_date?: string;
  interview_time?: string;
  meeting_link?: string;
  hired?: boolean;
  rejected?: boolean;
  current_status?: ApplicationStatus;
  disposition?: string;
  status?: ApplicationStatus;
  applied_at?: string;
  cv_url?: string;
}

export interface ApplicationListItem {
  id: number;
  candidate_id: number;
  job_id: number;
  cv_text?: string;
  cv_pdf_path?: string;
  gmail_message_id?: string;
  current_status: ApplicationStatus;
  disposition: string;
  match_score?: number;
  skill_gap?: string;
  summary?: string;
  final_score?: number;
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

export interface ApplicationDetail {
  id: number;
  candidate_id: number;
  job_id: number;
  current_status: ApplicationStatus;
  disposition: string;
  final_score?: number;
  created_at: string;
  updated_at: string;
  screening: {
    match_score?: number;
    skill_gap?: string;
    summary?: string;
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
  comments: Array<{
    id: number;
    application_id: number;
    author_id: number;
    author_name?: string;
    content: string;
    created_at: string;
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
    approval?: {
      id: number;
      approver_name?: string;
      comments?: string;
      decided_at?: string;
    };
  };
}
