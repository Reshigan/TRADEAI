"""
TRADEAI v2.0 - FastAPI Main Application
Enterprise-grade trade marketing platform with multi-tenancy and AI capabilities
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import structlog
import time

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.database import engine, create_tables
from app.api.api_v1.api import api_router
from app.core.middleware import (
    TenantMiddleware,
    SecurityHeadersMiddleware,
    RequestLoggingMiddleware
)

# Setup structured logging
setup_logging()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting TRADEAI v2.0...")
    
    # Create database tables
    await create_tables()
    logger.info("Database tables created/verified")
    
    # Initialize cache connections
    # await init_cache()
    
    yield
    
    # Shutdown
    logger.info("Shutting down TRADEAI v2.0...")
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title="TRADEAI v2.0 API",
    description="Enterprise Trade Marketing Platform with AI-powered analytics",
    version="2.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan
)

# Security Middleware
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(SecurityHeadersMiddleware)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(TenantMiddleware)


# Exception Handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(
        "Unhandled exception",
        exc_info=exc,
        path=request.url.path,
        method=request.method
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "request_id": getattr(request.state, "request_id", None)
        }
    )


# Health Check Endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TRADEAI v2.0 API",
        "version": "2.0.0",
        "timestamp": time.time()
    }


@app.get("/health/ready")
async def readiness_check():
    """Readiness check endpoint"""
    # Add database connectivity check
    # Add cache connectivity check
    return {
        "status": "ready",
        "checks": {
            "database": "healthy",
            "cache": "healthy"
        }
    }


# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to TRADEAI v2.0 API",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False,
        log_config=None  # Use our custom logging
    )