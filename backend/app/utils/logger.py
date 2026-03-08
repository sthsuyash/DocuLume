"""Logging configuration with structured JSON logging."""

import logging
import sys
import json
from datetime import datetime
from contextvars import ContextVar
from app.config import settings

# Context variable for request ID propagation
request_id_var: ContextVar[str] = ContextVar('request_id', default=None)


class StructuredFormatter(logging.Formatter):
    """JSON formatter for structured logging."""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request ID from contextvar or record
        request_id = request_id_var.get()
        if request_id:
            log_data["request_id"] = request_id
        elif hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # Add any extra attributes
        if hasattr(record, "__dict__"):
            for key, value in record.__dict__.items():
                if key not in ["name", "msg", "args", "created", "filename", "funcName",
                              "levelname", "levelno", "lineno", "module", "msecs",
                              "message", "pathname", "process", "processName",
                              "relativeCreated", "thread", "threadName", "exc_info",
                              "exc_text", "stack_info"]:
                    log_data[key] = value

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        if settings.log_format == "json":
            return json.dumps(log_data)
        else:
            return f"{log_data['timestamp']} - {log_data['level']} - {log_data['message']}"


def setup_logging():
    """Setup logging configuration."""
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    handler.setFormatter(StructuredFormatter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)

    # Reduce noise from some libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    return logging.getLogger(__name__)


logger = setup_logging()
