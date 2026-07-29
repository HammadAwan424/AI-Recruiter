import uuid
import os

def generate_video_meeting_link(meeting_type: str = "GOOGLE_MEET", title: str = "Interview") -> str:
    """Generates a video meeting link (Google Meet or instant Jitsi room fallback)."""
    clean_type = (meeting_type or "GOOGLE_MEET").upper()
    
    if clean_type == "JITSI":
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"https://meet.jit.si/Agentra-{unique_id}"
    
    # Try Google Calendar API meeting link generation
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        
        token_path = os.path.join(os.path.dirname(__file__), "..", "token.json")
        if os.path.exists(token_path):
            scopes = ['https://www.googleapis.com/auth/calendar']
            creds = Credentials.from_authorized_user_file(token_path, scopes)
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            
            service = build('calendar', 'v3', credentials=creds)
            event = {
                'summary': f"AI Recruiter Interview — {title}",
                'description': 'Interview scheduled via Agentra AI Recruiter Platform',
                'start': {'dateTime': '2026-07-29T10:00:00Z', 'timeZone': 'UTC'},
                'end': {'dateTime': '2026-07-29T11:00:00Z', 'timeZone': 'UTC'},
                'conferenceData': {
                    'createRequest': {
                        'requestId': str(uuid.uuid4()),
                        'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                    }
                }
            }
            res = service.events().insert(calendarId='primary', body=event, conferenceDataVersion=1).execute()
            if res.get('hangoutLink'):
                return res.get('hangoutLink')
    except Exception as err:
        print(f"[MEETING GENERATOR] Google Calendar API bypass: {err}")
    
    # Instant Jitsi fallback link
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"https://meet.jit.si/Agentra-{unique_id}"
