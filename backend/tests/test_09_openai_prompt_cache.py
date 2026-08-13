"""Manual integration test for OpenAI Responses API prompt caching.

Run with:

    OPENAI_API_KEY=... python backend/tests/test_09_openai_prompt_cache.py

The test intentionally uses only the Responses API ``input`` parameter. It
does not send ``instructions`` or a system message, so the reusable prefix is
part of the user input itself.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI


# Make ``backend/app`` importable when this file is run directly, matching the
# existing tests in this directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.utility.token_usage import get_token_usage


MODEL = os.getenv("OPENAI_CACHE_TEST_MODEL", "gpt-5.6-luna")
PROMPT_CACHE_KEY = os.getenv("OPENAI_CACHE_TEST_KEY", "airecruiter-prompt-cache-test")


def _static_prefix() -> str:
    """Build a stable prefix large enough to be eligible for prompt caching."""

    sections = [
        (
            f"Reference section {index}: The hiring workflow evaluates candidates "
            "using consistent, evidence-based criteria. Prefer information stated "
            "in the supplied reference, distinguish facts from assumptions, and "
            "give concise explanations for the final answer."
        )
        for index in range(1, 50)
    ]
    return "\n".join(sections)


def _usage_report(response: object) -> dict[str, object]:
    """Return the normalized usage report plus the generated response text."""

    usage = get_token_usage(response)
    output_text = getattr(response, "output_text", "")

    return {**usage, "response": output_text.strip()}


def test_openai_prompt_cache() -> None:
    """Call Responses repeatedly and verify that a later call reports a hit."""

    # This lets the test file be collected/run in environments without an API
    # key while remaining immediately runnable once the key is configured.
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("SKIP: set OPENAI_API_KEY to run the OpenAI prompt-cache test")
        return

    client = OpenAI(api_key=api_key)
    prefix = _static_prefix()
    questions = (
        "In one sentence, what does this reference prioritize?",
        "In one sentence, summarize the evaluation approach in this reference.",
        "In one sentence, state the main decision-making principle in this reference.",
    )

    reports: list[dict[str, object]] = []
    for question in questions:
        response = client.responses.create(
            model=MODEL,
            # Deliberately no instructions/system message: only input is sent.
            input=f"{prefix}\n\nQuestion: {question}",
            prompt_cache_key=PROMPT_CACHE_KEY,
            max_output_tokens=40,
        )
        report = _usage_report(response)
        reports.append(report)
        print(json.dumps(report, indent=2))

    assert all(report["response"] for report in reports), "The API returned an empty response"
    assert all(report["input_tokens"] > 1024 for report in reports), (
        "The test prompt must exceed 1,024 input tokens to exercise prompt caching"
    )
    assert any(report["cached_tokens"] > 0 for report in reports[1:]), (
        "No cached input tokens were reported after the warm-up request"
    )

    print(
        f"Prompt cache test passed: model={MODEL}, "
        f"cached tokens on later calls={[report['cached_tokens'] for report in reports[1:]]}"
    )


if __name__ == "__main__":
    test_openai_prompt_cache()
