import secrets

def generate_interview_token() -> str:
    """Generates a 48-character URL-safe random token for candidate self-scheduling."""
    return f"sched_{secrets.token_urlsafe(32)}"
