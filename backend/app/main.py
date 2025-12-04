"""
FastAPI main application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logging import setup_logging, get_logger
from app.core.config import settings
from app.api.routes import health, papers
from app import __version__

# Setup logging
setup_logging(level="INFO")
logger = get_logger(__name__)

# Create FastAPI app
app = FastAPI(
    title="hellomimir Backend API",
    description="Backend service for daily academic paper platform",
    version=__version__,
)

# CORS middleware (configure as needed for your frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(papers.router, tags=["Papers"])


@app.on_event("startup")
async def startup_event():
    """Log startup"""
    logger.info(f"hellomimir Backend API v{__version__} starting...")
    logger.info(f"Supabase URL: {settings.supabase_url}")
    logger.info(f"arXiv Base URL: {settings.arxiv_base_url}")


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown"""
    logger.info("hellomimir Backend API shutting down...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": "hellomimir Backend API",
        "version": __version__,
        "docs": "/docs",
        "health": "/health",
    }
