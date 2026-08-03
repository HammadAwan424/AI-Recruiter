export type OfferStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "SIGNED"
  | "DECLINED";

export interface OfferItem {
  id: number;
  application_id?: number;
  candidate_id?: number;
  job_id?: number;
  job_title: string;
  department?: string;
  base_salary: number;
  bonus_equity?: string;
  start_date: string;
  expiry_date?: string;
  offer_letter_text?: string;
  status: OfferStatus;
  audit_hash?: string;
  secure_token?: string;
  created_at?: string;
}

export interface OfferTemplate {
  id: number;
  title: string;
  content: string;
}

export interface OfferCreatePayload {
  application_id?: number;
  candidate_id: number;
  job_id: number;
  job_title: string;
  department?: string;
  base_salary: number;
  bonus_equity?: string;
  start_date: string;
  expiry_date?: string;
  offer_letter_text: string;
  submit_for_approval?: boolean;
}
