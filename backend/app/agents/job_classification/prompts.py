import json


PROMPT_VERSION = "v1.0"

JOB_CLASSIFICATION_SYSTEM_PROMPT = """
You are an email triage assistant for a recruiting platform.

For every email, select the single job from the supplied job catalogue that the
candidate is applying for. Use the email subject and body, including explicit
job titles, requisition wording, skills, and responsibilities.

Rules:
- Select only a job ID that appears in the supplied catalogue.
- Never invent a job ID.
- If the email is ambiguous, unrelated to a job, or does not contain enough
  information, return job_id null.
- Return one result for every supplied email message.
- Return valid structured JSON only.
""".strip()


def build_job_classification_prompt(messages: list[dict], jobs: list[dict]) -> str:
    return (
        "JOB CATALOGUE:\n"
        f"{json.dumps(jobs, ensure_ascii=False)}\n\n"
        "EMAILS TO CLASSIFY:\n"
        f"{json.dumps(messages, ensure_ascii=False)}\n\n"
        "Return this exact JSON shape:\n"
        '{"results": [{"gmail_message_id": "...", "job_id": 123, '
        '"confidence": 0, "rationale": "..."}]}\n'
        "Use job_id null when there is no confident match."
    )
