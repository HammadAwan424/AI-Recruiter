import os
import io
import base64
import re
import fitz
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']


def get_gmail_service():
    creds = None
    token_path = os.path.join(os.path.dirname(__file__), "..", "token.json")
    credentials_path = os.path.join(os.path.dirname(__file__), "..", "credentials.json")

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_path):
                raise FileNotFoundError(
                    "credentials.json not found in backend/app/! Download it from GCP Console."
                )
            flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    return build('gmail', 'v1', credentials=creds)


def extract_pdf_from_attachment(service, message_id: str, attachment_id: str):
    attachment = service.users().messages().attachments().get(
        userId='me',
        messageId=message_id,
        id=attachment_id
    ).execute()

    file_data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))

    doc = fitz.open(stream=file_data, filetype="pdf")
    extracted_text = ""
    for page in doc:
        extracted_text += page.get_text()

    return extracted_text, file_data


def extract_name_from_cv(cv_text: str, fallback_name: str = "") -> str:
    lines = [line.strip() for line in cv_text.split('\n') if line.strip()]

    junk_words = [
        "resume", "curriculum", "vitae", "cv", "page", "email", "phone",
        "mobile", "address", "contact", "profile", "summary", "objective",
        "experience", "education", "skills", "projects", "certifications"
    ]

    for line in lines[:5]:
        line_clean = re.sub(r'[^a-zA-Z\s\.\-]', '', line).strip()
        words = line_clean.split()

        if 2 <= len(words) <= 4:
            lower_words = [w.lower() for w in words]

            if any(junk in lower_words for junk in junk_words):
                continue

            if all(len(w) >= 2 for w in words):
                return line_clean

    for line in lines[:8]:
        trimmed = line.strip()
        words = trimmed.split()
        if 2 <= len(words) <= 4 and not any(char.isdigit() for char in trimmed):
            if "@" in trimmed or "http" in trimmed:
                continue
            if any(word[0].isupper() for word in words if word):
                return trimmed

    return fallback_name


# ──── Emails fetch (MOCKED FOR DEVELOPMENT / TESTING) ────
from app.data.mock_gmail_cvs import MOCK_GMAIL_CANDIDATE_APPLICATIONS


def fetch_job_application_emails(job_title: str, max_results: int = 20, job_keywords: str = ""):
    mock_entities = []
    for item in MOCK_GMAIL_CANDIDATE_APPLICATIONS:
        entity = dict(item)
        entity["subject"] = f"Application for {job_title}"
        mock_entities.append(entity)

    return mock_entities

    try:
        service = get_gmail_service()
        query = f'subject:"Application for {job_title}" has:attachment'
        results = service.users().messages().list(
            userId='me',
            q=query,
            maxResults=max_results
        ).execute()

        messages = results.get('messages', [])
        applications = []

        for msg in messages:
            message = service.users().messages().get(
                userId='me',
                id=msg['id'],
                format='full'
            ).execute()

            headers = message['payload'].get('headers', [])
            sender_email = ""
            sender_name = ""
            subject = ""

            for header in headers:
                if header['name'] == 'From':
                    from_value = header['value']
                    if '<' in from_value:
                        sender_name = from_value.split('<')[0].strip().strip('"')
                        sender_email = from_value.split('<')[1].replace('>', '').strip()
                    else:
                        sender_email = from_value.strip()
                elif header['name'] == 'Subject':
                    subject = header['value']

            cv_text = ""
            cv_filename = ""
            pdf_bytes = b""
            parts = message['payload'].get('parts', [])

            for part in parts:
                if part.get('filename', '').endswith('.pdf'):
                    attachment_id = part['body'].get('attachmentId', '')
                    if attachment_id:
                        cv_text, pdf_bytes = extract_pdf_from_attachment(
                            service, msg['id'], attachment_id
                        )
                        cv_filename = part['filename']
                        break

            if cv_text and sender_email:
                extracted_name = extract_name_from_cv(
                    cv_text,
                    fallback_name=sender_name or sender_email.split('@')[0]
                )

                applications.append({
                    'email': sender_email,
                    'full_name': extracted_name,
                    'name': extracted_name,
                    'phone': '',
                    'subject': subject,
                    'cv_text': cv_text,
                    'cv_pdf': pdf_bytes,
                    'cv_pdf_path': None,
                    'cv_filename': cv_filename,
                    'message_id': msg['id'],
                    'gmail_message_id': msg['id']
                })

        return applications
    except Exception as e:
        print(f"Gmail fetch error fallback: {e}")
        return mock_entities