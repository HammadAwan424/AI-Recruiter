"""Normalize token usage from OpenAI responses.

The OpenAI Responses API calls the main fields ``input_tokens`` and
``output_tokens``. Chat Completions and the legacy Completions API call the
same fields ``prompt_tokens`` and ``completion_tokens``. This module accepts
either SDK objects or dictionary-shaped responses and returns one consistent
breakdown without importing the OpenAI SDK.
"""

from __future__ import annotations

from collections.abc import Mapping
import logging
from typing import Any, TypedDict


class TokenUsageBreakdown(TypedDict):
    """Normalized token counts returned by :func:`get_token_usage`.

    ``completion_tokens`` is an alias for ``output_tokens`` so callers can use
    the name used by Chat Completions. ``reasoning_tokens`` is a subset of
    output/completion tokens when OpenAI reports it; it must not be added to
    ``output_tokens`` a second time.
    """

    input_tokens: int
    prompt_tokens: int
    uncached_input_tokens: int
    cached_tokens: int
    cache_write_tokens: int
    output_tokens: int
    completion_tokens: int
    visible_output_tokens: int
    reasoning_tokens: int
    audio_input_tokens: int
    audio_output_tokens: int
    accepted_prediction_tokens: int
    rejected_prediction_tokens: int
    total_tokens: int
    usage_available: bool
    input_details: dict[str, int]
    output_details: dict[str, int]


_MISSING = object()


def _read(value: Any, key: str, default: Any = _MISSING) -> Any:
    """Read a field from either a mapping or an SDK/Pydantic-style object."""

    if value is None:
        return default

    if isinstance(value, Mapping):
        return value.get(key, default)

    return getattr(value, key, default)


def _first(value: Any, keys: tuple[str, ...], default: Any = _MISSING) -> Any:
    """Return the first present, non-``None`` field from ``keys``."""

    for key in keys:
        candidate = _read(value, key)
        if candidate is not _MISSING and candidate is not None:
            return candidate
    return default


def _as_int(value: Any, default: int = 0) -> int:
    """Convert a token count to ``int`` while treating absent values as zero."""

    if value is _MISSING or value is None or isinstance(value, bool):
        return default

    try:
        return int(value)
    except (TypeError, ValueError, OverflowError):
        return default


def _detail_object(usage: Any, names: tuple[str, ...]) -> Any:
    """Find a detail object across Responses, Chat, Realtime, and wrappers."""

    return _first(usage, names, default=None)


def _numeric_detail_fields(detail: Any) -> dict[str, int]:
    """Copy numeric detail fields, including fields added by newer API versions."""

    if detail is None or detail is _MISSING:
        return {}

    if isinstance(detail, Mapping):
        items = detail.items()
    else:
        # OpenAI SDK models expose ``model_fields``; older SDK models expose
        # ``__fields__``. Falling back to ``__dict__`` keeps this utility
        # independent of SDK internals and works with SimpleNamespace too.
        field_names = _read(detail, "model_fields", _MISSING)
        if field_names is _MISSING:
            field_names = _read(detail, "__fields__", _MISSING)
        if field_names is _MISSING:
            field_names = vars(detail) if hasattr(detail, "__dict__") else {}
        names = field_names.keys() if isinstance(field_names, Mapping) else field_names
        items = ((name, _read(detail, name)) for name in names)

    result: dict[str, int] = {}
    for key, value in items:
        if isinstance(value, bool) or value is None:
            continue
        try:
            result[str(key)] = int(value)
        except (TypeError, ValueError, OverflowError):
            continue
    return result


def _find_usage(response: Any) -> tuple[Any, bool]:
    """Find usage in a direct response, a LangChain message, or a usage object."""

    direct_usage = _read(response, "usage")
    if direct_usage is not _MISSING and direct_usage is not None:
        return direct_usage, True

    # LangChain's AIMessage keeps normalized usage here.
    usage_metadata = _read(response, "usage_metadata")
    if usage_metadata is not _MISSING and usage_metadata is not None:
        return usage_metadata, True

    # ChatOpenAI can expose the native response usage under response_metadata.
    response_metadata = _read(response, "response_metadata")
    for key in ("token_usage", "usage"):
        metadata_usage = _read(response_metadata, key)
        if metadata_usage is not _MISSING and metadata_usage is not None:
            return metadata_usage, True

    # This also allows callers to pass response.usage directly.
    has_usage_field = any(
        _read(response, key) is not _MISSING
        for key in (
            "input_tokens",
            "prompt_tokens",
            "output_tokens",
            "completion_tokens",
            "total_tokens",
        )
    )
    return response, has_usage_field


def get_token_usage(response: Any) -> TokenUsageBreakdown:
    """Return a complete, normalized token breakdown for an OpenAI response.

    The function accepts:

    * a Responses API or Chat Completions SDK response;
    * a response converted to a dictionary with ``usage``;
    * a streaming usage chunk;
    * an OpenAI ``usage`` object itself; or
    * a LangChain ``AIMessage`` containing native or normalized usage.

    Missing counts are returned as ``0`` because not every model/API reports
    reasoning, caching, audio, or prediction details. Check
    ``usage_available`` to distinguish a response with no usage payload from a
    response whose usage fields legitimately contain zero.
    """

    usage, usage_available = _find_usage(response)

    input_tokens = _as_int(_first(usage, ("input_tokens", "prompt_tokens")))
    output_tokens = _as_int(_first(usage, ("output_tokens", "completion_tokens")))

    input_details = _detail_object(
        usage,
        ("input_tokens_details", "prompt_tokens_details", "input_token_details"),
    )
    output_details = _detail_object(
        usage,
        (
            "output_tokens_details",
            "completion_tokens_details",
            "output_token_details",
        ),
    )

    input_detail_counts = _numeric_detail_fields(input_details)
    output_detail_counts = _numeric_detail_fields(output_details)

    cached_tokens = _as_int(
        _first(
            input_details,
            (
                "cached_tokens",
                "cache_read_tokens",
                "cache_read_input_tokens",
                "cache_read",
            ),
            default=_first(
                usage,
                (
                    "cached_tokens",
                    "cache_read_tokens",
                    "cache_read_input_tokens",
                    "cache_read",
                ),
            ),
        )
    )
    cache_write_tokens = _as_int(
        _first(
            input_details,
            ("cache_write_tokens", "cache_written_tokens", "cache_write"),
            default=_first(
                usage,
                ("cache_write_tokens", "cache_written_tokens", "cache_write"),
            ),
        )
    )

    reasoning_tokens = _as_int(
        _first(
            output_details,
            ("reasoning_tokens", "reasoning"),
            default=_first(usage, ("reasoning_tokens", "reasoning")),
        )
    )
    audio_input_tokens = _as_int(
        _first(
            input_details,
            ("audio_tokens", "audio_input_tokens", "audio"),
            default=_first(usage, ("audio_input_tokens", "audio")),
        )
    )
    audio_output_tokens = _as_int(
        _first(
            output_details,
            ("audio_tokens", "audio_output_tokens", "audio"),
            default=_first(usage, ("audio_output_tokens", "audio")),
        )
    )
    accepted_prediction_tokens = _as_int(
        _first(
            output_details,
            ("accepted_prediction_tokens", "accepted_prediction"),
            default=_first(usage, ("accepted_prediction_tokens", "accepted_prediction")),
        )
    )
    rejected_prediction_tokens = _as_int(
        _first(
            output_details,
            ("rejected_prediction_tokens", "rejected_prediction"),
            default=_first(usage, ("rejected_prediction_tokens", "rejected_prediction")),
        )
    )

    total_value = _first(usage, ("total_tokens",))
    total_tokens = _as_int(total_value, default=input_tokens + output_tokens)
    if total_value is _MISSING or total_value is None:
        total_tokens = input_tokens + output_tokens

    return {
        "input_tokens": input_tokens,
        # API-compatible alias for Chat Completions and legacy Completions.
        "prompt_tokens": input_tokens,
        "uncached_input_tokens": max(input_tokens - cached_tokens, 0),
        "cached_tokens": cached_tokens,
        "cache_write_tokens": cache_write_tokens,
        "output_tokens": output_tokens,
        # API-compatible alias for Chat Completions and legacy Completions.
        "completion_tokens": output_tokens,
        # Reasoning tokens are included in output/completion_tokens by OpenAI.
        "visible_output_tokens": max(output_tokens - reasoning_tokens, 0),
        "reasoning_tokens": reasoning_tokens,
        "audio_input_tokens": audio_input_tokens,
        "audio_output_tokens": audio_output_tokens,
        "accepted_prediction_tokens": accepted_prediction_tokens,
        "rejected_prediction_tokens": rejected_prediction_tokens,
        "total_tokens": total_tokens,
        "usage_available": usage_available,
        # Keep newly introduced numeric detail fields available to callers
        # without changing the stable top-level shape. The known fields above
        # remain normalized aliases; these dictionaries retain the raw API
        # names (for example, ``audio_tokens``).
        "input_details": input_detail_counts,
        "output_details": output_detail_counts,
    }


def get_openai_token_usage(response: Any) -> TokenUsageBreakdown:
    """Explicitly named alias for :func:`get_token_usage`."""

    return get_token_usage(response)


def get_token_breakdown(response: Any) -> TokenUsageBreakdown:
    """Explicitly named alias for :func:`get_token_usage`."""

    return get_token_usage(response)


def log_token_usage(
    logger: logging.Logger,
    stage: str,
    response: object,
) -> TokenUsageBreakdown:
    """Normalize usage, log its complete breakdown, and return it.

    Pass the raw LangChain ``AIMessage`` here, not the parsed Pydantic result.
    Only token counts and detail fields are logged; the response content is
    intentionally excluded because it may contain sensitive candidate data.
    """

    usage = get_token_usage(response)

    logger.info(
        (
            "%s token usage: input=%d prompt=%d uncached_input=%d cached=%d "
            "cache_write=%d output=%d completion=%d visible_output=%d "
            "reasoning=%d audio_input=%d audio_output=%d "
            "accepted_prediction=%d rejected_prediction=%d total=%d "
        ),
        stage,
        usage["input_tokens"],
        usage["prompt_tokens"],
        usage["uncached_input_tokens"],
        usage["cached_tokens"],
        usage["cache_write_tokens"],
        usage["output_tokens"],
        usage["completion_tokens"],
        usage["visible_output_tokens"],
        usage["reasoning_tokens"],
        usage["audio_input_tokens"],
        usage["audio_output_tokens"],
        usage["accepted_prediction_tokens"],
        usage["rejected_prediction_tokens"],
        usage["total_tokens"]
    )
    return usage


__all__ = [
    "log_token_usage",
    "TokenUsageBreakdown",
    "get_openai_token_usage",
    "get_token_breakdown",
    "get_token_usage",
]
