import uuid


def generate_video_meeting_link(meeting_type: str = "GOOGLE_MEET", title: str = "Interview") -> str:
    """
    Generates a video meeting link for scheduled candidate interview rounds.

    TODO: Move to Google Calendar API meeting link generation later when we introduce
    Google Sign-In for Gmail inboxes and individual users as well in case they need it.
    """
    unique_id = str(uuid.uuid4())[:8].upper()
    return f"https://meet.jit.si/AIRecruiter-{unique_id}"
