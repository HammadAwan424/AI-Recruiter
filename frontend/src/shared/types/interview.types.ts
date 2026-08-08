import { JobPost } from "./job.types";

export interface InterviewerAssignmentItem {
  id: number;
  interview_id: number;
  interviewer_id: number;
  interviewer?: {
    id: number;
    full_name: string;
    email: string;
  };
}

export interface InterviewItem {
  id: number;
  application_id: number;
  round_number?: number;
  round_label?: string;
  candidate_name?: string;
  candidate_id?: number;
  candidate_email?: string;
  job_title?: string;
  schedule_start?: string;
  schedule_end?: string;
  status: "AWAITING_SELECTION" | "SCHEDULED" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | string;
  meeting_type?: string;
  meeting_link?: string;
  self_schedule_token?: string;
  token_expires_at?: string;
  created_by?: number;
  interviewer_assignments?: InterviewerAssignmentItem[];
}

export interface InterviewSlot {
  id: number;
  interviewer_id: number;
  job_id: number | null;
  job?: JobPost | null;
  schedule_start: string;
  schedule_end: string;
  is_booked: boolean;
  created_at: string;
}

export interface InterviewerDetail {
  id: number;
  company_id: number;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  available_slots: InterviewSlot[];
}

export interface SlotCreatePayload {
  job_id: number | null;
  schedule_start: string;
  schedule_end: string;
}

export interface InterviewerSlotAssignment {
  interviewer_id: number;
  slot_id: number;
}

export interface FixedScheduleInterviewPayload {
  application_id: number;
  round_number?: number;
  round_label?: string;
  meeting_type: string;
  notes?: string;
  schedule_type: "fixed";
  assignments: InterviewerSlotAssignment[];
}

export interface SelfScheduleInterviewPayload {
  application_id: number;
  round_number?: number;
  round_label?: string;
  meeting_type: string;
  notes?: string;
  schedule_type: "self_schedule";
  self_schedule_token_expires_at: string;
  interviewer_ids: number[];
}

export type InterviewCreatePayload = FixedScheduleInterviewPayload | SelfScheduleInterviewPayload;

export interface InterviewCreateRequest {
  payload: InterviewCreatePayload;
}

export interface InterviewPublicSlotResponse {
  candidate_name: string;
  job_title: string;
  company_name: string;
  available_slots: InterviewSlot[];
}
