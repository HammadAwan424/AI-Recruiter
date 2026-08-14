from __future__ import annotations

import sys
from pathlib import Path
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from app.utility.token_usage import (
    get_openai_token_usage,
    get_token_breakdown,
    get_token_usage,
    log_token_usage,
)


def test_responses_api_usage_object_is_normalized() -> None:
    response = SimpleNamespace(
        usage=SimpleNamespace(
            input_tokens=100,
            input_tokens_details=SimpleNamespace(
                cached_tokens=25,
                cache_write_tokens=75,
            ),
            output_tokens=80,
            output_tokens_details=SimpleNamespace(reasoning_tokens=20),
            total_tokens=180,
        )
    )

    result = get_token_usage(response)

    assert result == {
        "input_tokens": 100,
        "prompt_tokens": 100,
        "uncached_input_tokens": 75,
        "cached_tokens": 25,
        "cache_write_tokens": 75,
        "output_tokens": 80,
        "completion_tokens": 80,
        "visible_output_tokens": 60,
        "reasoning_tokens": 20,
        "audio_input_tokens": 0,
        "audio_output_tokens": 0,
        "accepted_prediction_tokens": 0,
        "rejected_prediction_tokens": 0,
        "total_tokens": 180,
        "usage_available": True,
        "input_details": {"cached_tokens": 25, "cache_write_tokens": 75},
        "output_details": {"reasoning_tokens": 20},
    }


def test_chat_completions_dictionary_supports_all_detail_variants() -> None:
    response = {
        "usage": {
            "prompt_tokens": 120,
            "prompt_tokens_details": {
                "cached_tokens": 40,
                "cache_write_tokens": 80,
                "audio_tokens": 6,
            },
            "completion_tokens": 90,
            "completion_tokens_details": {
                "reasoning_tokens": 30,
                "audio_tokens": 4,
                "accepted_prediction_tokens": 5,
                "rejected_prediction_tokens": 2,
            },
            "total_tokens": 210,
        }
    }

    result = get_token_usage(response)

    assert result["input_tokens"] == result["prompt_tokens"] == 120
    assert result["output_tokens"] == result["completion_tokens"] == 90
    assert result["cached_tokens"] == 40
    assert result["cache_write_tokens"] == 80
    assert result["uncached_input_tokens"] == 80
    assert result["reasoning_tokens"] == 30
    assert result["visible_output_tokens"] == 60
    assert result["audio_input_tokens"] == 6
    assert result["audio_output_tokens"] == 4
    assert result["accepted_prediction_tokens"] == 5
    assert result["rejected_prediction_tokens"] == 2
    assert result["total_tokens"] == 210
    assert result["input_details"]["audio_tokens"] == 6
    assert result["output_details"]["audio_tokens"] == 4


def test_langchain_usage_metadata_aliases_are_supported() -> None:
    response = SimpleNamespace(
        usage_metadata={
            "input_tokens": 100,
            "input_token_details": {"cache_read": 25, "audio": 3},
            "output_tokens": 80,
            "output_token_details": {"reasoning": 20, "audio": 4},
            "total_tokens": 180,
        }
    )

    result = get_token_usage(response)

    assert result["cached_tokens"] == 25
    assert result["audio_input_tokens"] == 3
    assert result["reasoning_tokens"] == 20
    assert result["audio_output_tokens"] == 4
    assert result["visible_output_tokens"] == 60


def test_log_token_usage_returns_normalized_result() -> None:
    class Logger:
        def __init__(self) -> None:
            self.messages: list[tuple[object, ...]] = []

        def info(self, *args: object) -> None:
            self.messages.append(args)

    logger = Logger()
    result = log_token_usage(
        logger,  # type: ignore[arg-type]
        "test",
        {"usage": {"input_tokens": 4, "output_tokens": 6, "total_tokens": 10}},
    )

    assert result["total_tokens"] == 10
    assert len(logger.messages) == 1


def test_langchain_metadata_and_missing_total_are_supported() -> None:
    response = SimpleNamespace(
        response_metadata={
            "token_usage": {
                "prompt_tokens": 10,
                "completion_tokens": 7,
            }
        }
    )

    result = get_token_usage(response)

    assert result["input_tokens"] == 10
    assert result["output_tokens"] == 7
    assert result["total_tokens"] == 17
    assert result["usage_available"] is True


def test_usage_object_can_be_passed_directly_and_aliases_work() -> None:
    usage = {"input_tokens": 3, "output_tokens": 2, "total_tokens": 5}

    assert get_token_breakdown(usage) == get_token_usage(usage)
    assert get_openai_token_usage(usage) == get_token_usage(usage)


def test_response_without_usage_returns_zero_counts() -> None:
    result = get_token_usage(SimpleNamespace(id="resp_without_usage"))

    assert result["input_tokens"] == 0
    assert result["output_tokens"] == 0
    assert result["total_tokens"] == 0
    assert result["usage_available"] is False
