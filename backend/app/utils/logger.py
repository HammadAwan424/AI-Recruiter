import os
import logging
from typing import Optional

LOG_FORMAT = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# ──── Top-level automatic logging initialization ────
_LOG_LEVEL_NAME = os.getenv("LOG_LEVEL", "INFO").upper()
_DEFAULT_LEVEL = getattr(logging, _LOG_LEVEL_NAME, logging.INFO)

logging.basicConfig(
    level=_DEFAULT_LEVEL,
    format=LOG_FORMAT,
    datefmt=DATE_FORMAT,
)

_FORMATTER = logging.Formatter(LOG_FORMAT, DATE_FORMAT)

# Format Uvicorn default loggers automatically
for _uv_name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
    _uv_log = logging.getLogger(_uv_name)
    _uv_log.setLevel(_DEFAULT_LEVEL)
    for _h in _uv_log.handlers:
        _h.setFormatter(_FORMATTER)


def get_logger(name: str = "root", log_file: Optional[str] = None) -> logging.Logger:
    """
    Unified Logger Factory.
    - If `name` is "root" (or "webserver" / empty), targets the Root Logger.
      If `log_file` is provided, binds a FileHandler to the root logger.
    - Otherwise, returns a module-specific (narrow) Logger instance.
      If `log_file` is provided, binds a dedicated FileHandler to that specific logger.
    """
    if name.lower() in ("root", "", "webserver"):
        target_logger = logging.getLogger()
    else:
        target_logger = logging.getLogger(name)

    if log_file:
        # Prevent attaching duplicate FileHandlers for the same file path
        handler_exists = any(
            isinstance(h, logging.FileHandler) and getattr(h, "baseFilename", "").endswith(os.path.basename(log_file))
            for h in target_logger.handlers
        )
        if not handler_exists:
            file_handler = logging.FileHandler(log_file, mode="a")
            file_handler.setFormatter(_FORMATTER)
            target_logger.addHandler(file_handler)

    return target_logger
