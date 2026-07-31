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
  resume_score?: number;
  technical_score?: number;
  communication_score?: number;
  interview_date?: string;
  interview_time?: string;
  interviewer_1?: string;
  interviewer_2?: string;
  meeting_link?: string;
  hired?: boolean;
  rejected?: boolean;
  status?: ApplicationStatus;
  applied_at?: string;
  cv_url?: string;
}

export interface RankedCandidatesResponse {
  job_id: number;
  total: number;
  ranked_list: CandidateApplication[];
}
