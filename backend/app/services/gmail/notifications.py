import logging
from typing import Optional
from app.services.gmail.send_mails import send_email_service
from app.schemas.gmail import OutboundEmailResult

logger = logging.getLogger(__name__)

# Base HTML Template Wrapper with Modern Dark UI
def _wrap_html_template(title: str, content_body: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{title}</title>
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0d12; color: #e5e7eb; margin: 0; padding: 24px; }}
        .container {{ max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
        .header {{ border-b: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }}
        .brand {{ color: #05DC7F; font-size: 20px; font-weight: bold; letter-spacing: -0.5px; }}
        .content {{ line-height: 1.6; font-size: 14px; color: #d1d5db; }}
        .btn {{ display: inline-block; background-color: #05DC7F; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin-top: 20px; margin-bottom: 20px; text-align: center; }}
        .card {{ background-color: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 16px 0; }}
        .field {{ margin-bottom: 8px; font-size: 13px; }}
        .label {{ color: #9ca3af; font-weight: 600; }}
        .value {{ color: #ffffff; font-weight: 700; font-family: monospace; }}
        .footer {{ border-top: 1px solid rgba(255,255,255,0.1); margin-top: 32px; padding-top: 16px; font-size: 11px; color: #6b7280; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="brand">AI Recruiter</div>
        </div>
        <div class="content">
          {content_body}
        </div>
        <div class="footer">
          &copy; AI Recruiter Automated Talent Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """


# ─────────────────────────────────────────────────────────────
# 1. EXECUTIVE OFFER APPROVAL REQUEST
# ─────────────────────────────────────────────────────────────
def notify_executive_offer_approval(
    approver_email: str,
    candidate_name: str,
    job_title: str,
    base_salary: float,
    bonus_equity: Optional[str] = None,
    start_date: Optional[str] = None
) -> Optional[OutboundEmailResult]:
    """One-liner to notify CEO/Executive of a pending offer approval request."""
    if not approver_email:
        return None
    subject = f"Action Required: Offer Approval Request for {candidate_name} ({job_title})"
    body_text = f"An offer approval request requires your executive review for {candidate_name} as {job_title}. Base Salary: ${base_salary:,.2f}."
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #ffffff; margin-top: 0;">Executive Offer Approval Request</h2>
        <p>An offer letter package has been generated and requires your sign-off approval.</p>
        <div class="card">
          <div class="field"><span class="label">Candidate:</span> <span class="value">{candidate_name}</span></div>
          <div class="field"><span class="label">Position:</span> <span class="value">{job_title}</span></div>
          <div class="field"><span class="label">Base Salary:</span> <span class="value">${base_salary:,.2f} / yr</span></div>
          <div class="field"><span class="label">Bonus / Equity:</span> <span class="value">{bonus_equity or 'N/A'}</span></div>
          <div class="field"><span class="label">Proposed Start Date:</span> <span class="value">{start_date or 'TBD'}</span></div>
        </div>
        <p>Please log in to the Executive Dashboard to review and approve or request revisions for this offer.</p>
        """
    )
    try:
        return send_email_service(approver_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send offer approval request email to {approver_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 2. OFFICIAL CANDIDATE OFFER LETTER
# ─────────────────────────────────────────────────────────────
def notify_candidate_offer_letter(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str,
    secure_token: str,
    base_salary: float,
    start_date: Optional[str] = None,
    frontend_base_url: str = "http://localhost:5173"
) -> Optional[OutboundEmailResult]:
    """One-liner to send official offer letter with secure signing link to candidate."""
    if not candidate_email:
        return None
    offer_link = f"{frontend_base_url}/offers/public/{secure_token}"
    subject = f"Official Offer of Employment: {job_title} at {company_name}"
    body_text = f"Congratulations {candidate_name}! {company_name} is pleased to offer you the position of {job_title}. View and sign your offer letter at: {offer_link}"
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #05DC7F; margin-top: 0;">Congratulations, {candidate_name}!</h2>
        <p>We are thrilled to extend an official offer of employment for the position of <strong>{job_title}</strong> at <strong>{company_name}</strong>.</p>
        <div class="card">
          <div class="field"><span class="label">Position:</span> <span class="value">{job_title}</span></div>
          <div class="field"><span class="label">Base Salary:</span> <span class="value">${base_salary:,.2f} / yr</span></div>
          <div class="field"><span class="label">Start Date:</span> <span class="value">{start_date or 'To be finalized'}</span></div>
        </div>
        <p>Please click the button below to review your complete offer letter terms, sign electronically, or submit feedback:</p>
        <a href="{offer_link}" class="btn">View & Sign Offer Letter</a>
        <p style="font-size: 12px; color: #9ca3af;">Link: <a href="{offer_link}" style="color: #05DC7F;">{offer_link}</a></p>
        """
    )
    try:
        return send_email_service(candidate_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send offer letter email to {candidate_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 3. RECRUITER ALERT ON EXECUTIVE DECISION
# ─────────────────────────────────────────────────────────────
def notify_recruiter_offer_decision(
    recruiter_email: str,
    candidate_name: str,
    job_title: str,
    decision: str,
    comments: Optional[str] = None
) -> Optional[OutboundEmailResult]:
    """One-liner to notify recruiter/creator of executive offer sign-off or revision request."""
    if not recruiter_email:
        return None
    subject = f"Offer Decision ({decision.upper()}): {candidate_name} - {job_title}"
    body_text = f"The offer request for {candidate_name} ({job_title}) was marked as '{decision}'. Comments: {comments or 'None'}."
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #ffffff; margin-top: 0;">Offer Status Update: {decision.upper()}</h2>
        <p>The offer package for <strong>{candidate_name}</strong> ({job_title}) has been updated.</p>
        <div class="card">
          <div class="field"><span class="label">Candidate:</span> <span class="value">{candidate_name}</span></div>
          <div class="field"><span class="label">Decision:</span> <span class="value">{decision.upper()}</span></div>
          <div class="field"><span class="label">Comments:</span> <span class="value">{comments or 'No additional notes provided'}</span></div>
        </div>
        """
    )
    try:
        return send_email_service(recruiter_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send offer decision email to {recruiter_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 4. CANDIDATE WELCOME & ONBOARDING (SIGNED OFFER)
# ─────────────────────────────────────────────────────────────
def notify_candidate_welcome_onboarding(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str,
    start_date: Optional[str] = None,
    audit_hash: Optional[str] = None
) -> Optional[OutboundEmailResult]:
    """One-liner to send welcome & onboarding confirmation email to hired candidate."""
    if not candidate_email:
        return None
    subject = f"Welcome to {company_name}! Onboarding Instructions for {job_title}"
    body_text = f"Welcome to the team, {candidate_name}! Your signed offer for {job_title} at {company_name} has been received. Your start date is {start_date or 'Pending'}."
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #05DC7F; margin-top: 0;">Welcome to {company_name}, {candidate_name}!</h2>
        <p>We are excited to confirm that your signed offer letter for <strong>{job_title}</strong> has been finalized and processed.</p>
        <div class="card">
          <div class="field"><span class="label">Position:</span> <span class="value">{job_title}</span></div>
          <div class="field"><span class="label">Target Start Date:</span> <span class="value">{start_date or 'To be confirmed by HR'}</span></div>
          {f'<div class="field"><span class="label">Audit Hash:</span> <span class="value">{audit_hash[:16]}...</span></div>' if audit_hash else ''}
        </div>
        <p>Our HR & Talent team will reach out shortly with pre-onboarding documents and first-day details.</p>
        """
    )
    try:
        return send_email_service(candidate_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send welcome onboarding email to {candidate_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 5. CANDIDATE INTERVIEW MEETING INVITE
# ─────────────────────────────────────────────────────────────
def notify_candidate_interview_invite(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    meeting_link: str,
    scheduled_date: str,
    scheduled_time: str
) -> Optional[OutboundEmailResult]:
    """One-liner to send interview confirmation & meeting link to candidate."""
    if not candidate_email:
        return None
    subject = f"Interview Scheduled: {job_title} Interview"
    body_text = f"Dear {candidate_name}, your interview for {job_title} is confirmed for {scheduled_date} at {scheduled_time}. Join via Google Meet: {meeting_link}"
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #05DC7F; margin-top: 0;">Interview Scheduled</h2>
        <p>Dear {candidate_name}, your upcoming interview round for <strong>{job_title}</strong> has been confirmed.</p>
        <div class="card">
          <div class="field"><span class="label">Date:</span> <span class="value">{scheduled_date}</span></div>
          <div class="field"><span class="label">Time:</span> <span class="value">{scheduled_time}</span></div>
          <div class="field"><span class="label">Meeting Link:</span> <a href="{meeting_link}" style="color: #05DC7F;">{meeting_link}</a></div>
        </div>
        <a href="{meeting_link}" class="btn">Join Video Interview</a>
        """
    )
    try:
        return send_email_service(candidate_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send interview invite email to {candidate_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 6. CANDIDATE SELF-SCHEDULE INVITATION LINK
# ─────────────────────────────────────────────────────────────
def notify_candidate_self_schedule(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    schedule_token: str,
    frontend_base_url: str = "http://localhost:5173"
) -> Optional[OutboundEmailResult]:
    """One-liner to send self-schedule link to candidate."""
    if not candidate_email:
        return None
    schedule_link = f"{frontend_base_url}/interviews/public/schedule?token={schedule_token}"
    subject = f"Action Required: Select Your Interview Slot for {job_title}"
    body_text = f"Dear {candidate_name}, please select your preferred interview time slot for {job_title} at: {schedule_link}"
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #ffffff; margin-top: 0;">Schedule Your Interview</h2>
        <p>Dear {candidate_name}, you have been invited to schedule your interview round for <strong>{job_title}</strong>.</p>
        <p>Please click the button below to view available time slots and select the time that works best for you:</p>
        <a href="{schedule_link}" class="btn">Select Interview Slot</a>
        <p style="font-size: 12px; color: #9ca3af;">Link: <a href="{schedule_link}" style="color: #05DC7F;">{schedule_link}</a></p>
        """
    )
    try:
        return send_email_service(candidate_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send self-schedule email to {candidate_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 7. INTERVIEWER ASSIGNMENT NOTIFICATION
# ─────────────────────────────────────────────────────────────
def notify_interviewer_assignment(
    interviewer_email: str,
    interviewer_name: str,
    candidate_name: str,
    job_title: str,
    scheduled_date: str,
    scheduled_time: str,
    meeting_link: str
) -> Optional[OutboundEmailResult]:
    """One-liner to notify an interviewer of an assigned candidate round."""
    if not interviewer_email:
        return None
    subject = f"Interview Assignment: Candidate {candidate_name} ({job_title})"
    body_text = f"Hello {interviewer_name}, you have been assigned to interview {candidate_name} for {job_title} on {scheduled_date} at {scheduled_time}. Meeting Link: {meeting_link}"
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #ffffff; margin-top: 0;">Interview Assignment</h2>
        <p>Hello {interviewer_name}, you have been assigned as an interviewer for an upcoming candidate round.</p>
        <div class="card">
          <div class="field"><span class="label">Candidate:</span> <span class="value">{candidate_name}</span></div>
          <div class="field"><span class="label">Requisition:</span> <span class="value">{job_title}</span></div>
          <div class="field"><span class="label">Date:</span> <span class="value">{scheduled_date}</span></div>
          <div class="field"><span class="label">Time:</span> <span class="value">{scheduled_time}</span></div>
          <div class="field"><span class="label">Meeting Link:</span> <a href="{meeting_link}" style="color: #05DC7F;">{meeting_link}</a></div>
        </div>
        <a href="{meeting_link}" class="btn">Join Interview Room</a>
        """
    )
    try:
        return send_email_service(interviewer_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send interviewer assignment email to {interviewer_email}: {e}")
        return None


# ─────────────────────────────────────────────────────────────
# 8. CANDIDATE REJECTION NOTICE
# ─────────────────────────────────────────────────────────────
def notify_candidate_rejection(
    candidate_email: str,
    candidate_name: str,
    job_title: str,
    company_name: str = "AI Recruiter"
) -> Optional[OutboundEmailResult]:
    """One-liner to send professional rejection email to candidate."""
    if not candidate_email:
        return None
    subject = f"Update regarding your application for {job_title} at {company_name}"
    body_text = f"Dear {candidate_name}, thank you for applying for {job_title} at {company_name}. After careful consideration, we have decided to move forward with other candidates."
    html_content = _wrap_html_template(
        title=subject,
        content_body=f"""
        <h2 style="color: #ffffff; margin-top: 0;">Application Status Update</h2>
        <p>Dear {candidate_name},</p>
        <p>Thank you for taking the time to apply for the <strong>{job_title}</strong> position at <strong>{company_name}</strong>.</p>
        <p>After careful review of your qualifications and experience, we have decided to move forward with other candidates whose profiles more closely align with our current role requirements.</p>
        <p>We appreciate your interest in joining our team and wish you all the best in your professional endeavors.</p>
        """
    )
    try:
        return send_email_service(candidate_email, subject, body_text, html_content)
    except Exception as e:
        logger.error(f"Failed to send candidate rejection email to {candidate_email}: {e}")
        return None
