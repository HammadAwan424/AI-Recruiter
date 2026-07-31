export interface InterviewItem {
  id: number;
  candidate_name?: string;
  candidate_id?: number;
  job_title?: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  status: "scheduled" | "completed" | "cancelled" | "no_response" | string;
  meeting_type?: string;
  meeting_link?: string;
  interviewer_1?: string;
  interviewer_2?: string;
  self_schedule_token?: string;
}

export interface InterviewSlot {
  id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export interface SlotCreatePayload {
  slot_date: string;
  start_time: string;
  end_time: string;
}
