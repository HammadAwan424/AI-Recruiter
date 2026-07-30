import os
import sys
import uuid


async def call_mcp_tools(
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    company_name: str,
    scheduled_date: str,
    scheduled_time: str,
    interviewer_1_email: str,
    interviewer_2_email: str = "",
    hr_name: str = "HR Team",
    sender_email: str = "",
    sender_password: str = ""
):
    """
    Helper function to invoke MCP meeting & email tools.
    - Generates meeting link via generate_meeting_link MCP tool.
    - Sends interview invitation email via send_interview_email MCP tool.
    """
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[os.path.join(os.path.dirname(__file__), "..", "mcp_servers", "meeting_email_server.py")],
    )

    meet_link = ""
    email_sent = False

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()

                meet_result = await session.call_tool(
                    "generate_meeting_link",
                    {
                        "title": f"Interview — {job_title} at {company_name}",
                        "date": scheduled_date,
                        "time": scheduled_time,
                        "attendees": [
                            candidate_email,
                            interviewer_1_email,
                            interviewer_2_email or ""
                        ]
                    }
                )
                meet_link = meet_result.content[0].text

                email_result = await session.call_tool(
                    "send_interview_email",
                    {
                        "candidate_name": candidate_name,
                        "candidate_email": candidate_email,
                        "job_title": job_title,
                        "company_name": company_name,
                        "scheduled_date": scheduled_date,
                        "scheduled_time": scheduled_time,
                        "meeting_link": meet_link,
                        "interviewer_1_email": interviewer_1_email,
                        "interviewer_2_email": interviewer_2_email or "",
                        "hr_name": hr_name,
                        "sender_email": sender_email,
                        "sender_password": sender_password
                    }
                )
                email_sent = "successfully sent" in email_result.content[0].text.lower()

    except Exception as e:
        print(f"MCP error: {e}")
        unique_id = str(uuid.uuid4())[:8].upper()
        meet_link = f"https://meet.jit.si/Agentra-{unique_id}"
        email_sent = False

    return meet_link, email_sent
