from datetime import date, time, datetime, timedelta

def generate_ical_event(
    title: str,
    description: str,
    scheduled_date: date,
    scheduled_time: time,
    duration_minutes: int,
    location_url: str,
    organizer_email: str = "hr@agentra.com",
    attendee_email: str = ""
) -> str:
    """Generates an RFC 5545 compliant .ics calendar invitation string."""
    start_dt = datetime.combine(scheduled_date, scheduled_time)
    end_dt = start_dt + timedelta(minutes=duration_minutes)

    dtstart_str = start_dt.strftime("%Y%m%dT%H%M%SZ")
    dtend_str = end_dt.strftime("%Y%m%dT%H%M%SZ")
    dtstamp_str = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")

    ical_content = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Agentra AI Recruiter//Interview Scheduling Engine//EN\r\n"
        "CALSCALE:GREGORIAN\r\n"
        "METHOD:REQUEST\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:interview-{dtstart_str}-{scheduled_date.isoformat()}@agentra.com\r\n"
        f"DTSTAMP:{dtstamp_str}\r\n"
        f"DTSTART:{dtstart_str}\r\n"
        f"DTEND:{dtend_str}\r\n"
        f"SUMMARY:{title}\r\n"
        f"DESCRIPTION:{description} Join Video Call: {location_url}\r\n"
        f"LOCATION:{location_url}\r\n"
        f"ORGANIZER;CN=Agentra HR:mailto:{organizer_email}\r\n"
    )

    if attendee_email:
        ical_content += f"ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE;CN={attendee_email}:mailto:{attendee_email}\r\n"

    ical_content += (
        "STATUS:CONFIRMED\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )

    return ical_content
