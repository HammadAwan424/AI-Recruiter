import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, Any

from app.utils.gmail import get_gmail_service


def send_email_service(
    recipient_email: str,
    subject: str,
    body_text: str,
    html_content: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sends an email to recipient_email via Gmail API.
    - recipient_email: Destination email address.
    - subject: Email subject line.
    - body_text: Plain text body.
    - html_content: Optional HTML body alternative.
    """
    if not recipient_email:
        raise ValueError("recipient_email must be provided")

    service = get_gmail_service()

    if html_content:
        message = MIMEMultipart("alternative")
        message["To"] = recipient_email
        message["Subject"] = subject
        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(html_content, "html")
        message.attach(part1)
        message.attach(part2)
    else:
        message = MIMEText(body_text, "plain")
        message["To"] = recipient_email
        message["Subject"] = subject

    raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    send_payload = {"raw": raw_message}

    sent_message = service.users().messages().send(
        userId="me",
        body=send_payload
    ).execute()

    return {
        "message_id": sent_message.get("id"),
        "thread_id": sent_message.get("threadId"),
        "recipient": recipient_email,
        "subject": subject,
        "status": "sent"
    }
