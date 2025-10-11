"""
Health check endpoints
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.db.database import get_db, DatabaseManager

router = APIRouter()
logger = structlog.get_logger()


@router.get("/")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "service": "TRADEAI v2.0 API",
        "version": "2.0.0"
    }


@router.get("/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with dependencies"""
    
    # Check database
    db_healthy = await DatabaseManager.health_check()
    db_info = await DatabaseManager.get_connection_info()
    
    # Check cache (Redis) - TODO: implement
    cache_healthy = True  # Placeholder
    
    # Overall status
    overall_status = "healthy" if db_healthy and cache_healthy else "unhealthy"
    
    return {
        "status": overall_status,
        "service": "TRADEAI v2.0 API",
        "version": "2.0.0",
        "checks": {
            "database": {
                "status": "healthy" if db_healthy else "unhealthy",
                **db_info
            },
            "cache": {
                "status": "healthy" if cache_healthy else "unhealthy"
            }
        }
    }