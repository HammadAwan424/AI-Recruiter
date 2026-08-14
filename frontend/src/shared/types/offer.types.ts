export type OfferStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVAL_REJECTED"
  | "SENT"
  | "SIGNED"
  | "DECLINED"
  | "EXPIRED";

export type SignatureType = "DRAWN" | "TYPED";

export interface OfferTemplateResponse {
  id: number;
  company_id?: number | null;
  title: string;
  department: string;
  content: string;
  is_active: boolean;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * OfferTemplate is an alias of OfferTemplateResponse for backward compatibility.
 */
export type OfferTemplate = OfferTemplateResponse;

export interface OfferTemplateCreatePayload {
  title: string;
  department?: string;
  content: string;
  is_active?: boolean;
}

export interface OfferResponse {
  id: number;
  application_id: number;
  candidate_id?: number | null;
  job_id?: number | null;
  job_title?: string | null;
  department?: string | null;
  candidate_name?: string | null;
  template_id?: number | null;
  base_salary: number;
  bonus_equity?: string | null;
  start_date: string;
  expiry_date?: string | null;
  offer_letter_text: string;
  status: OfferStatus;
  secure_token?: string | null;
  token_expires_at?: string | null;
  signature_type?: SignatureType | null;
  signature_data?: string | null;
  signer_name?: string | null;
  signer_ip?: string | null;
  signer_user_agent?: string | null;
  signed_at?: string | null;
  decline_reason?: string | null;
  audit_hash?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * OfferItem is an alias of OfferResponse for backward compatibility.
 */
export type OfferItem = OfferResponse;

export interface OfferPublicResponse {
  id: number;
  application_id: number;
  base_salary: number;
  bonus_equity?: string | null;
  start_date: string;
  expiry_date?: string | null;
  offer_letter_text: string;
  candidate_name: string;
  candidate_email: string;
  job_title: string;
  company_name: string;
  status: OfferStatus;
  signed_at?: string | null;
  decline_reason?: string | null;
}

export type ExecutiveOfferDecision =
  | { decision: "approved"; comments?: string | null }
  | { decision: "rejected"; comments?: string | null };

export type CandidateOfferDecision =
  | { decision: "signed"; signer_name: string; signature_type: SignatureType; signature_data: string }
  | { decision: "declined"; decline_reason: string };

export interface OfferCreatePayload {
  application_id: number;
  candidate_id?: number;
  job_id?: number;
  job_title?: string;
  department?: string;
  candidate_name?: string;
  template_id?: number | null;
  base_salary: number;
  bonus_equity?: string | null;
  start_date: string;
  expiry_date?: string | null;
  offer_letter_text: string;
  submit_for_approval?: boolean;
}

export interface OfferUpdatePayload {
  base_salary?: number | null;
  bonus_equity?: string | null;
  start_date?: string | null;
  expiry_date?: string | null;
  offer_letter_text?: string | null;
}
