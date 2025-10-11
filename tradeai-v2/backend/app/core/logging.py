"""
Structured logging configuration for TRADEAI v2.0
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.stdlib import LoggerFactory

from app.core.config import settings


def setup_logging() -> None:
    """Configure structured logging"""
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if settings.ENVIRONMENT == "production" 
            else structlog.dev.ConsoleRenderer(colors=True)
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.DEBUG if settings.DEBUG else logging.INFO,
    )
    
    # Set log levels for third-party libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )


def get_logger(name: str = None) -> structlog.stdlib.BoundLogger:
    """Get a structured logger instance"""
    return structlog.get_logger(name)


class RequestContextFilter(logging.Filter):
    """Add request context to log records"""
    
    def filter(self, record: logging.LogRecord) -> bool:
        # Add request context if available
        # This would be populated by middleware
        record.request_id = getattr(record, 'request_id', None)
        record.tenant_id = getattr(record, 'tenant_id', None)
        record.user_id = getattr(record, 'user_id', None)
        return True


def log_request(
    method: str,
    path: str,
    status_code: int,
    duration: float,
    **kwargs: Any
) -> None:
    """Log HTTP request"""
    logger = get_logger("request")
    
    log_data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration * 1000, 2),
        **kwargs
    }
    
    if status_code >= 500:
        logger.error("HTTP request failed", **log_data)
    elif status_code >= 400:
        logger.warning("HTTP request error", **log_data)
    else:
        logger.info("HTTP request", **log_data)


def log_database_query(
    query: str,
    duration: float,
    **kwargs: Any
) -> None:
    """Log database query"""
    logger = get_logger("database")
    
    logger.debug(
        "Database query",
        query=query,
        duration_ms=round(duration * 1000, 2),
        **kwargs
    )


def log_business_event(
    event: str,
    entity_type: str,
    entity_id: str,
    **kwargs: Any
) -> None:
    """Log business events for audit trail"""
    logger = get_logger("business")
    
    logger.info(
        "Business event",
        event=event,
        entity_type=entity_type,
        entity_id=entity_id,
        **kwargs
    )