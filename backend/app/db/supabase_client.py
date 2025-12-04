"""
Supabase database client and operations
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from supabase import create_client, Client

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import (
    AcademicField,
    Paper,
    DailyPaper,
    ReadingLevel,
    QuizData,
    JargonEntry,
    PrerequisiteEntry,
    DifficultyLevel,
)

logger = get_logger(__name__)


class SupabaseClient:
    """Wrapper for Supabase operations"""

    def __init__(self):
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
        logger.info("Supabase client initialized")

    # ========== Field Operations ==========

    async def get_fields(self) -> List[AcademicField]:
        """Get all fields"""
        try:
            response = self.client.table("fields").select("*").order("name").execute()
            return [AcademicField(**item) for item in response.data]
        except Exception as e:
            logger.error(f"Error fetching fields: {e}")
            raise

    async def get_field_by_slug(self, slug: str) -> Optional[AcademicField]:
        """Get field by slug"""
        try:
            response = self.client.table("fields").select("*").eq("slug", slug).single().execute()
            return AcademicField(**response.data) if response.data else None
        except Exception as e:
            if "PGRST116" in str(e):  # Not found
                return None
            logger.error(f"Error fetching field: {e}")
            raise

    # ========== Paper Operations ==========

    async def get_paper_by_arxiv_id(self, arxiv_id: str) -> Optional[Paper]:
        """Get paper by arXiv ID"""
        try:
            response = self.client.table("papers").select("*").eq("arxiv_id", arxiv_id).single().execute()
            return Paper(**response.data) if response.data else None
        except Exception as e:
            if "PGRST116" in str(e):
                return None
            logger.error(f"Error fetching paper: {e}")
            raise

    async def upsert_paper(self, paper_data: Dict[str, Any]) -> Paper:
        """Insert or update paper"""
        try:
            response = (
                self.client.table("papers")
                .upsert(paper_data, on_conflict="arxiv_id")
                .execute()
            )
            logger.info(f"Upserted paper: {paper_data.get('arxiv_id')}")
            # Supabase upsert returns a list, get first item
            paper_dict = response.data[0] if response.data else None
            if not paper_dict:
                raise ValueError("Upsert returned no data")
            return Paper(**paper_dict)
        except Exception as e:
            logger.error(f"Error upserting paper: {e}")
            raise

    async def update_paper_full_text(self, paper_id: UUID, full_text: str) -> None:
        """Update paper full text"""
        try:
            self.client.table("papers").update({"full_text": full_text}).eq("id", str(paper_id)).execute()
            logger.info(f"Updated full text for paper {paper_id}")
        except Exception as e:
            logger.error(f"Error updating full text: {e}")
            raise

    # ========== Daily Paper Operations ==========

    async def get_daily_paper(self, field_id: UUID, date: str) -> Optional[DailyPaper]:
        """Get daily paper for field and date"""
        try:
            response = (
                self.client.table("daily_papers")
                .select("*")
                .eq("field_id", str(field_id))
                .eq("date", date)
                .single()
                .execute()
            )
            return DailyPaper(**response.data) if response.data else None
        except Exception as e:
            if "PGRST116" in str(e):
                return None
            logger.error(f"Error fetching daily paper: {e}")
            raise

    async def create_daily_paper(self, date: str, field_id: UUID, paper_id: UUID) -> DailyPaper:
        """Create daily paper entry"""
        try:
            response = (
                self.client.table("daily_papers")
                .insert({"date": date, "field_id": str(field_id), "paper_id": str(paper_id)})
                .select()
                .single()
                .execute()
            )
            logger.info(f"Created daily paper for {date}, field {field_id}")
            return DailyPaper(**response.data)
        except Exception as e:
            logger.error(f"Error creating daily paper: {e}")
            raise

    async def get_used_paper_arxiv_ids(self, field_id: UUID) -> List[str]:
        """Get all arxiv IDs used for a field"""
        try:
            response = (
                self.client.table("daily_papers")
                .select("paper_id, papers!inner(arxiv_id)")
                .eq("field_id", str(field_id))
                .execute()
            )
            return [item["papers"]["arxiv_id"] for item in response.data if item.get("papers")]
        except Exception as e:
            logger.error(f"Error fetching used papers: {e}")
            raise

    # ========== Summary Operations ==========

    async def summaries_exist(self, paper_id: UUID, field_id: UUID) -> bool:
        """Check if summaries exist"""
        try:
            response = (
                self.client.table("paper_summaries")
                .select("*", count="exact")
                .eq("paper_id", str(paper_id))
                .eq("field_id", str(field_id))
                .execute()
            )
            return response.count >= 3
        except Exception as e:
            logger.error(f"Error checking summaries: {e}")
            return False

    async def create_paper_summary(
        self, paper_id: UUID, field_id: UUID, level: ReadingLevel, summary_text: str
    ) -> None:
        """Create or update paper summary"""
        try:
            self.client.table("paper_summaries").upsert(
                {
                    "paper_id": str(paper_id),
                    "field_id": str(field_id),
                    "level": level,
                    "summary_text": summary_text,
                },
                on_conflict="paper_id,field_id,level",
            ).execute()
            logger.info(f"Created {level} summary for paper {paper_id}")
        except Exception as e:
            logger.error(f"Error creating summary: {e}")
            raise

    # ========== Quiz Operations ==========

    async def quiz_exists(self, paper_id: UUID, field_id: UUID) -> bool:
        """Check if quiz exists"""
        try:
            response = (
                self.client.table("paper_quizzes")
                .select("*", count="exact")
                .eq("paper_id", str(paper_id))
                .eq("field_id", str(field_id))
                .execute()
            )
            return response.count > 0
        except Exception as e:
            logger.error(f"Error checking quiz: {e}")
            return False

    async def create_paper_quiz(self, paper_id: UUID, field_id: UUID, quiz_data: QuizData) -> None:
        """Create or update paper quiz"""
        try:
            self.client.table("paper_quizzes").upsert(
                {
                    "paper_id": str(paper_id),
                    "field_id": str(field_id),
                    "quiz_json": quiz_data.model_dump(),
                },
                on_conflict="paper_id,field_id",
            ).execute()
            logger.info(f"Created quiz for paper {paper_id}")
        except Exception as e:
            logger.error(f"Error creating quiz: {e}")
            raise

    # ========== Pre-reading Operations ==========

    async def prereading_exists(self, paper_id: UUID, field_id: UUID) -> bool:
        """Check if pre-reading materials exist"""
        try:
            response = (
                self.client.table("paper_prereading")
                .select("*", count="exact")
                .eq("paper_id", str(paper_id))
                .eq("field_id", str(field_id))
                .execute()
            )
            return response.count > 0
        except Exception as e:
            logger.error(f"Error checking prereading: {e}")
            return False

    async def create_paper_prereading(
        self,
        paper_id: UUID,
        field_id: UUID,
        jargon: List[JargonEntry],
        prerequisites: List[PrerequisiteEntry],
        difficulty_level: DifficultyLevel,
        estimated_read_time: int,
        key_concepts: List[str],
    ) -> None:
        """Create or update pre-reading materials"""
        try:
            self.client.table("paper_prereading").upsert(
                {
                    "paper_id": str(paper_id),
                    "field_id": str(field_id),
                    "jargon_json": [j.model_dump() for j in jargon],
                    "prerequisites_json": [p.model_dump() for p in prerequisites],
                    "difficulty_level": difficulty_level,
                    "estimated_read_time_minutes": estimated_read_time,
                    "key_concepts": key_concepts,
                },
                on_conflict="paper_id,field_id",
            ).execute()
            logger.info(f"Created prereading for paper {paper_id}")
        except Exception as e:
            logger.error(f"Error creating prereading: {e}")
            raise


# Global Supabase client instance
db = SupabaseClient()
