"""
Configuration management using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Supabase Configuration
    supabase_url: str
    supabase_service_role_key: str

    # OpenAI Configuration
    openai_api_key: str

    # arXiv Configuration
    arxiv_base_url: str = "http://export.arxiv.org/api/query"
    arxiv_rate_limit_seconds: int = 3

    # Cron Secret for endpoint authentication
    cron_secret: Optional[str] = None

    # Optional: Clarifai for future OCR
    clarifai_api_key: Optional[str] = None

    # App Configuration
    app_name: str = "hellomimir Backend"
    debug: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
