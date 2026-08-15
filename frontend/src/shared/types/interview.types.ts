import type { UserResponse } from "./user.types";
import type { JobResponse } from "./job.types";

export type MeetingType = "GOOGLE_MEET" | "JITSI" | "IN_PERSON";

export type InterviewStatus =
  | "AWAITING_SELECTION"
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export interface InterviewSlotResponse {
  id: number;
  interviewer_id: number;
  job_id?: number | null;
  schedule_start: string;
  schedule_end: string;
  is_booked: boolean;
  created_at: string;
}

export interface InterviewSlotDetail extends InterviewSlotResponse {
  job?: JobResponse | null;
}

export type InterviewSlot = InterviewSlotDetail;

export interface InterviewFeedbackResponse {
  id: number;
  interview_interviewer_id: number;
  interview_id?: number | null;
  interviewer_id?: number | null;
  technical_score: number;
  communication_score: number;
  notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewerAssignment {
  interviewer_id: number;
  interviewer: UserResponse;
  feedback?: InterviewFeedbackResponse | null;
}

export interface InterviewResponse {
  id: number;
  application_id: number;
  round_number: number;
  round_label?: string | null;
  schedule_start?: string | null;
  schedule_end?: string | null;
  meeting_type: MeetingType;
  meeting_link: string;
  self_schedule_token?: string | null;
  token_expires_at?: string | null;
  status: InterviewStatus;
  notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
  candidate_name?: string | null;
  candidate_email?: string | null;
  job_title?: string | null;
  application_match_score?: number | null;
}

export interface InterviewDetail extends InterviewResponse {
  interviewer_assignments: InterviewerAssignment[];
}

/**
 * InterviewItem is an alias of InterviewDetail for backward compatibility.
 */
export type InterviewItem = InterviewDetail;

export interface InterviewerDetail extends UserResponse {
  available_slots: InterviewSlotDetail[];
}

export interface InterviewPublicSlotResponse {
  candidate_name: string;
  job_title: string;
  company_name: string;
  available_slots: InterviewSlotResponse[];
}

export interface InterviewerSlotAssignment {
  interviewer_id: number;
  slot_id: number;
}

export interface FixedScheduleInterviewPayload {
  application_id: number;
  round_number?: number;
  round_label?: string;
  meeting_type: MeetingType;
  notes?: string;
  schedule_type: "fixed";
  assignments: InterviewerSlotAssignment[];
}

export interface SelfScheduleInterviewPayload {
  application_id: number;
  round_number?: number;
  round_label?: string;
  meeting_type: MeetingType;
  notes?: string;
  schedule_type: "self_schedule";
  self_schedule_token_expires_at: string;
  interviewer_ids: number[];
}

export type InterviewCreatePayload = FixedScheduleInterviewPayload | SelfScheduleInterviewPayload;

export interface InterviewCreateRequest {
  payload: InterviewCreatePayload;
}

export interface SlotCreatePayload {
  job_id?: number | null;
  schedule_start: string;
  schedule_end: string;
}

export interface InterviewFeedbackCreatePayload {
  interviewer_id?: number;
  technical_score: number;
  communication_score: number;
  notes?: string;
}
