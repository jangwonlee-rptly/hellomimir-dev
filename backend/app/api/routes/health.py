"""
Health check and status endpoints
"""
from datetime import datetime, timezone
from fastapi import APIRouter

from app.db.models import HealthResponse, StatusResponse
from app.db.supabase_client import db
from app import __version__

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Simple health check endpoint

    Returns basic status and timestamp
    """
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc),
        version=__version__,
    )


@router.get("/internal/status", response_model=StatusResponse)
async def status_check():
    """
    Detailed status endpoint with service checks

    Returns status information including database connectivity
    """
    # Test database connection
    db_connected = False
    try:
        fields = await db.get_fields()
        db_connected = True
    except Exception:
        db_connected = False

    return StatusResponse(
        status="ok" if db_connected else "degraded",
        timestamp=datetime.now(timezone.utc),
        version=__version__,
        database_connected=db_connected,
        services={
            "supabase": "connected" if db_connected else "disconnected",
            "arxiv": "available",
            "openai": "available",
        },
    )
