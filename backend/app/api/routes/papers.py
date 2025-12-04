"""
Paper ingestion endpoints
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import IngestResultSchema, IngestDailyRequest
from app.services.paper_service import paper_service

logger = get_logger(__name__)
router = APIRouter()


def verify_cron_secret(x_cron_secret: Optional[str] = Header(None)) -> bool:
    """
    Verify cron secret for authentication

    Args:
        x_cron_secret: Secret from X-Cron-Secret header

    Returns:
        True if authorized

    Raises:
        HTTPException: If unauthorized
    """
    if not settings.cron_secret:
        logger.warning("CRON_SECRET not configured - allowing all requests")
        return True

    if x_cron_secret != settings.cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return True


@router.post("/internal/papers/daily", response_model=IngestResultSchema)
async def run_daily_ingestion(
    request: IngestDailyRequest = IngestDailyRequest(),
    x_cron_secret: Optional[str] = Header(None),
):
    """
    Run daily paper ingestion for all fields

    This endpoint:
    1. Fetches papers from arXiv for each field
    2. Selects an unused paper
    3. Generates summaries and quiz
    4. Stores everything in the database

    Args:
        request: Optional date override (defaults to today)
        x_cron_secret: Authentication secret

    Returns:
        IngestResultSchema with results for all fields
    """
    verify_cron_secret(x_cron_secret)

    try:
        logger.info(f"Starting daily paper processing for date: {request.date or 'today'}")
        results = await paper_service.ingest_daily_papers(request.date)

        success_count = sum(1 for r in results if r.success)
        fail_count = len(results) - success_count
        date = request.date or paper_service.get_today_date()

        return IngestResultSchema(
            message=f"Processed {len(results)} fields",
            date=date,
            success_count=success_count,
            fail_count=fail_count,
            results=results,
        )
    except Exception as e:
        logger.error(f"Error in daily paper cron job: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Failed to process daily papers",
                "details": str(e),
            },
        )
