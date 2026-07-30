import uuid
import random

SUPPORTED_BOARDS = ["indeed", "linkedin", "glassdoor", "careers_page"]


def distribute_job(job_id: int, job_title: str, boards: list[str]) -> list[dict]:
    """
    MVP ke liye simulated distribution - asli Indeed/LinkedIn/Glassdoor APIs
    abhi partner-approval maangte hain. Ye function har board ke liye
    fake posting reference bana ke 'posted' status return karta hai.
    """
    results = []
    for board in boards:
        if board not in SUPPORTED_BOARDS:
            results.append({
                "board": board,
                "status": "failed",
                "external_ref": None,
                "error": "Unsupported board"
            })
            continue

        if random.random() < 0.95:
            fake_ref = f"{board}-{uuid.uuid4().hex[:8]}"
            results.append({
                "board": board,
                "status": "posted",
                "external_ref": fake_ref,
                "error": None
            })
        else:
            results.append({
                "board": board,
                "status": "failed",
                "external_ref": None,
                "error": "Simulated posting failure"
            })

    return results
