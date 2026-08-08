export interface PlaceholderOption {
  tag: string;
  label: string;
}

export const FIXED_OFFER_PLACEHOLDERS: PlaceholderOption[] = [
  { tag: "{{candidate_name}}", label: "Candidate Name" },
  { tag: "{{job_title}}", label: "Job Title" },
  { tag: "{{department}}", label: "Department" },
  { tag: "{{base_salary}}", label: "Base Salary" },
  { tag: "{{bonus_equity}}", label: "Bonus & Equity" },
  { tag: "{{start_date}}", label: "Start Date" },
  { tag: "{{expiry_date}}", label: "Expiry Date" },
  { tag: "{{company_name}}", label: "Company Name" },
];

/**
 * Dynamically substitutes all 8 standard placeholders in an offer letter template.
 */
export function renderOfferTemplate(content: string, data: Record<string, any>): string {
  if (!content) return "";
  let rendered = content;

  const candidateName = data.candidate_name || data.full_name || (data.candidate_id ? `Candidate #${data.candidate_id}` : "[Candidate Name]");
  const jobTitle = data.job_title || "[Job Title]";
  const department = data.department || "[Department]";
  const baseSalary = data.base_salary ? `$${Number(data.base_salary).toLocaleString()}` : "[Base Salary]";
  const bonusEquity = data.bonus_equity || "[Bonus/Equity]";
  const startDate = data.start_date || "[Start Date]";
  const expiryDate = data.expiry_date || "[Expiry Date]";
  const companyName = data.company_name || "AI Recruiter";

  return rendered
    .replace(/{{candidate_name}}/g, candidateName)
    .replace(/{{job_title}}/g, jobTitle)
    .replace(/{{department}}/g, department)
    .replace(/{{base_salary}}/g, baseSalary)
    .replace(/{{bonus_equity}}/g, bonusEquity)
    .replace(/{{start_date}}/g, startDate)
    .replace(/{{expiry_date}}/g, expiryDate)
    .replace(/{{company_name}}/g, companyName);
}
