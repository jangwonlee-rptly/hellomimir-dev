"""
User profile and interaction service
"""
from typing import List, Optional
from uuid import UUID

from app.db.supabase_client import db
from app.db.models import (
    UserProfile,
    UserProfileUpdate,
    UserQuizScore,
    QuizScoreSubmission,
    UserPaperNote,
    UserFavoritePaper,
    UserViewedPaper,
    UserProfileWithField,
    ViewedPaperWithDetails,
    FavoritePaperWithDetails,
    QuizScoreWithDetails,
    AcademicField,
)
from app.core.logging import get_logger

logger = get_logger(__name__)


class UserService:
    """Service for user profile and interaction management"""

    # ========== Profile Operations ==========

    async def get_profile(self, user_id: str) -> Optional[UserProfile]:
        """Get user profile"""
        try:
            response = (
                db.client.table("user_profiles")
                .select("*")
                .eq("id", user_id)
                .single()
                .execute()
            )
            return UserProfile(**response.data) if response.data else None
        except Exception as e:
            if "PGRST116" in str(e):  # Not found
                return None
            logger.error(f"Error fetching profile for user {user_id}: {e}")
            raise

    async def get_profile_with_field(self, user_id: str) -> Optional[UserProfileWithField]:
        """Get user profile with preferred field details"""
        try:
            response = (
                db.client.table("user_profiles")
                .select("*, fields(*)")
                .eq("id", user_id)
                .single()
                .execute()
            )
            if not response.data:
                return None

            data = response.data
            field_data = data.pop("fields", None)

            return UserProfileWithField(
                id=data["id"],
                preferred_field_id=data.get("preferred_field_id"),
                preferred_field=AcademicField(**field_data) if field_data else None,
                display_name=data.get("display_name"),
                avatar_url=data.get("avatar_url"),
                created_at=data["created_at"],
                updated_at=data["updated_at"],
            )
        except Exception as e:
            if "PGRST116" in str(e):
                return None
            logger.error(f"Error fetching profile with field for user {user_id}: {e}")
            raise

    async def update_profile(self, user_id: str, update: UserProfileUpdate) -> UserProfile:
        """Update user profile"""
        try:
            update_data = update.model_dump(exclude_none=True)
            if "preferred_field_id" in update_data:
                update_data["preferred_field_id"] = str(update_data["preferred_field_id"])

            response = (
                db.client.table("user_profiles")
                .update(update_data)
                .eq("id", user_id)
                .execute()
            )

            if not response.data:
                raise ValueError(f"Profile not found for user {user_id}")

            logger.info(f"Updated profile for user {user_id}")
            return UserProfile(**response.data[0])
        except Exception as e:
            logger.error(f"Error updating profile for user {user_id}: {e}")
            raise

    # ========== Viewed Papers Operations ==========

    async def record_paper_view(
        self, user_id: str, paper_id: UUID, field_id: Optional[UUID] = None
    ) -> UserViewedPaper:
        """Record that user viewed a paper"""
        try:
            data = {
                "user_id": user_id,
                "paper_id": str(paper_id),
            }
            if field_id:
                data["field_id"] = str(field_id)

            response = (
                db.client.table("user_viewed_papers")
                .upsert(data, on_conflict="user_id,paper_id")
                .execute()
            )

            logger.info(f"Recorded paper view for user {user_id}, paper {paper_id}")
            return UserViewedPaper(**response.data[0])
        except Exception as e:
            logger.error(f"Error recording paper view: {e}")
            raise

    async def get_viewed_papers(
        self, user_id: str, limit: int = 50
    ) -> List[ViewedPaperWithDetails]:
        """Get user's viewed paper history with details"""
        try:
            response = (
                db.client.table("user_viewed_papers")
                .select("*, papers(id, title, arxiv_id), fields(id, name)")
                .eq("user_id", user_id)
                .order("viewed_at", desc=True)
                .limit(limit)
                .execute()
            )

            results = []
            for item in response.data:
                paper = item.get("papers", {})
                field = item.get("fields", {})
                results.append(
                    ViewedPaperWithDetails(
                        id=item["id"],
                        paper_id=paper.get("id"),
                        paper_title=paper.get("title", "Unknown"),
                        paper_arxiv_id=paper.get("arxiv_id", "Unknown"),
                        field_id=field.get("id") if field else None,
                        field_name=field.get("name") if field else None,
                        viewed_at=item["viewed_at"],
                    )
                )
            return results
        except Exception as e:
            logger.error(f"Error fetching viewed papers for user {user_id}: {e}")
            raise

    # ========== Quiz Score Operations ==========

    async def submit_quiz_score(
        self, user_id: str, submission: QuizScoreSubmission
    ) -> UserQuizScore:
        """Submit quiz score"""
        try:
            response = (
                db.client.table("user_quiz_scores")
                .insert(
                    {
                        "user_id": user_id,
                        "paper_id": str(submission.paper_id),
                        "field_id": str(submission.field_id),
                        "score": submission.score,
                        "total_questions": submission.total_questions,
                        "answers_json": submission.answers,
                    }
                )
                .execute()
            )

            logger.info(
                f"Submitted quiz score for user {user_id}, "
                f"paper {submission.paper_id}: {submission.score}/{submission.total_questions}"
            )
            return UserQuizScore(**response.data[0])
        except Exception as e:
            logger.error(f"Error submitting quiz score: {e}")
            raise

    async def get_quiz_scores(
        self, user_id: str, limit: int = 50
    ) -> List[QuizScoreWithDetails]:
        """Get user's quiz score history with details"""
        try:
            response = (
                db.client.table("user_quiz_scores")
                .select("*, papers(id, title, arxiv_id), fields(id, name)")
                .eq("user_id", user_id)
                .order("completed_at", desc=True)
                .limit(limit)
                .execute()
            )

            results = []
            for item in response.data:
                paper = item.get("papers", {})
                field = item.get("fields", {})
                results.append(
                    QuizScoreWithDetails(
                        id=item["id"],
                        paper_id=paper.get("id"),
                        paper_title=paper.get("title", "Unknown"),
                        paper_arxiv_id=paper.get("arxiv_id", "Unknown"),
                        field_id=field.get("id"),
                        field_name=field.get("name", "Unknown"),
                        score=item["score"],
                        total_questions=item["total_questions"],
                        completed_at=item["completed_at"],
                    )
                )
            return results
        except Exception as e:
            logger.error(f"Error fetching quiz scores for user {user_id}: {e}")
            raise

    async def get_quiz_score_for_paper(
        self, user_id: str, paper_id: UUID, field_id: UUID
    ) -> Optional[UserQuizScore]:
        """Get best quiz score for specific paper"""
        try:
            response = (
                db.client.table("user_quiz_scores")
                .select("*")
                .eq("user_id", user_id)
                .eq("paper_id", str(paper_id))
                .eq("field_id", str(field_id))
                .order("score", desc=True)
                .limit(1)
                .execute()
            )

            if not response.data:
                return None

            return UserQuizScore(**response.data[0])
        except Exception as e:
            logger.error(f"Error fetching quiz score for paper: {e}")
            raise

    # ========== Favorites Operations ==========

    async def add_favorite(self, user_id: str, paper_id: UUID) -> UserFavoritePaper:
        """Add paper to favorites"""
        try:
            response = (
                db.client.table("user_favorite_papers")
                .upsert(
                    {"user_id": user_id, "paper_id": str(paper_id)},
                    on_conflict="user_id,paper_id",
                )
                .execute()
            )

            logger.info(f"Added favorite for user {user_id}, paper {paper_id}")
            return UserFavoritePaper(**response.data[0])
        except Exception as e:
            logger.error(f"Error adding favorite: {e}")
            raise

    async def remove_favorite(self, user_id: str, paper_id: UUID) -> None:
        """Remove paper from favorites"""
        try:
            db.client.table("user_favorite_papers").delete().eq(
                "user_id", user_id
            ).eq("paper_id", str(paper_id)).execute()

            logger.info(f"Removed favorite for user {user_id}, paper {paper_id}")
        except Exception as e:
            logger.error(f"Error removing favorite: {e}")
            raise

    async def get_favorites(self, user_id: str) -> List[FavoritePaperWithDetails]:
        """Get user's favorite papers with details"""
        try:
            response = (
                db.client.table("user_favorite_papers")
                .select("*, papers(id, title, arxiv_id)")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )

            results = []
            for item in response.data:
                paper = item.get("papers", {})
                results.append(
                    FavoritePaperWithDetails(
                        id=item["id"],
                        paper_id=paper.get("id"),
                        paper_title=paper.get("title", "Unknown"),
                        paper_arxiv_id=paper.get("arxiv_id", "Unknown"),
                        created_at=item["created_at"],
                    )
                )
            return results
        except Exception as e:
            logger.error(f"Error fetching favorites for user {user_id}: {e}")
            raise

    async def is_favorite(self, user_id: str, paper_id: UUID) -> bool:
        """Check if paper is in user's favorites"""
        try:
            response = (
                db.client.table("user_favorite_papers")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .eq("paper_id", str(paper_id))
                .execute()
            )
            return response.count > 0
        except Exception as e:
            logger.error(f"Error checking favorite status: {e}")
            return False

    # ========== Notes Operations ==========

    async def save_note(
        self, user_id: str, paper_id: UUID, note_text: str
    ) -> UserPaperNote:
        """Create or update note for paper"""
        try:
            response = (
                db.client.table("user_paper_notes")
                .upsert(
                    {
                        "user_id": user_id,
                        "paper_id": str(paper_id),
                        "note_text": note_text,
                    },
                    on_conflict="user_id,paper_id",
                )
                .execute()
            )

            logger.info(f"Saved note for user {user_id}, paper {paper_id}")
            return UserPaperNote(**response.data[0])
        except Exception as e:
            logger.error(f"Error saving note: {e}")
            raise

    async def get_note(self, user_id: str, paper_id: UUID) -> Optional[UserPaperNote]:
        """Get user's note for a paper"""
        try:
            response = (
                db.client.table("user_paper_notes")
                .select("*")
                .eq("user_id", user_id)
                .eq("paper_id", str(paper_id))
                .single()
                .execute()
            )

            return UserPaperNote(**response.data) if response.data else None
        except Exception as e:
            if "PGRST116" in str(e):
                return None
            logger.error(f"Error fetching note: {e}")
            raise

    async def delete_note(self, user_id: str, paper_id: UUID) -> None:
        """Delete user's note for a paper"""
        try:
            db.client.table("user_paper_notes").delete().eq("user_id", user_id).eq(
                "paper_id", str(paper_id)
            ).execute()

            logger.info(f"Deleted note for user {user_id}, paper {paper_id}")
        except Exception as e:
            logger.error(f"Error deleting note: {e}")
            raise


# Global user service instance
user_service = UserService()
