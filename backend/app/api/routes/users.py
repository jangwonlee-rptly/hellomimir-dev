"""
User profile and data endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.core.auth import get_current_user, AuthUser
from app.services.user_service import user_service
from app.db.models import (
    UserProfile,
    UserProfileUpdate,
    UserProfileWithField,
    UserQuizScore,
    QuizScoreSubmission,
    UserPaperNote,
    UserPaperNoteCreate,
    UserFavoritePaper,
    UserViewedPaper,
    UserViewedPaperCreate,
    ViewedPaperWithDetails,
    FavoritePaperWithDetails,
    QuizScoreWithDetails,
)

router = APIRouter(prefix="/users", tags=["Users"])


# ========== Profile Endpoints ==========


@router.get("/me", response_model=UserProfileWithField)
async def get_my_profile(user: AuthUser = Depends(get_current_user)):
    """Get current user's profile with preferred field details"""
    profile = await user_service.get_profile_with_field(user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
    return profile


@router.patch("/me", response_model=UserProfile)
async def update_my_profile(
    update: UserProfileUpdate,
    user: AuthUser = Depends(get_current_user),
):
    """Update current user's profile"""
    try:
        return await user_service.update_profile(user.id, update)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


# ========== Viewed Papers Endpoints ==========


@router.post("/me/viewed-papers", response_model=UserViewedPaper)
async def record_paper_view(
    data: UserViewedPaperCreate,
    user: AuthUser = Depends(get_current_user),
):
    """Record that user viewed a paper"""
    return await user_service.record_paper_view(
        user.id, data.paper_id, data.field_id
    )


@router.get("/me/viewed-papers", response_model=List[ViewedPaperWithDetails])
async def get_viewed_papers(
    limit: int = 50,
    user: AuthUser = Depends(get_current_user),
):
    """Get user's paper view history"""
    return await user_service.get_viewed_papers(user.id, limit)


# ========== Quiz Score Endpoints ==========


@router.post("/me/quiz-scores", response_model=UserQuizScore)
async def submit_quiz_score(
    submission: QuizScoreSubmission,
    user: AuthUser = Depends(get_current_user),
):
    """Submit a quiz score"""
    return await user_service.submit_quiz_score(user.id, submission)


@router.get("/me/quiz-scores", response_model=List[QuizScoreWithDetails])
async def get_quiz_scores(
    limit: int = 50,
    user: AuthUser = Depends(get_current_user),
):
    """Get user's quiz score history"""
    return await user_service.get_quiz_scores(user.id, limit)


@router.get("/me/quiz-scores/{paper_id}/{field_id}", response_model=UserQuizScore)
async def get_quiz_score_for_paper(
    paper_id: UUID,
    field_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    """Get best quiz score for specific paper"""
    score = await user_service.get_quiz_score_for_paper(user.id, paper_id, field_id)
    if not score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No quiz score found for this paper",
        )
    return score


# ========== Favorites Endpoints ==========


@router.post("/me/favorites/{paper_id}", response_model=UserFavoritePaper)
async def add_favorite(
    paper_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    """Add paper to favorites"""
    return await user_service.add_favorite(user.id, paper_id)


@router.delete("/me/favorites/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    paper_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    """Remove paper from favorites"""
    await user_service.remove_favorite(user.id, paper_id)


@router.get("/me/favorites", response_model=List[FavoritePaperWithDetails])
async def get_favorites(user: AuthUser = Depends(get_current_user)):
    """Get user's favorite papers"""
    return await user_service.get_favorites(user.id)


@router.get("/me/favorites/{paper_id}/status")
async def check_favorite_status(
    paper_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    """Check if paper is in favorites"""
    is_favorite = await user_service.is_favorite(user.id, paper_id)
    return {"is_favorite": is_favorite}


# ========== Notes Endpoints ==========


@router.put("/me/notes/{paper_id}", response_model=UserPaperNote)
async def save_note(
    paper_id: UUID,
    data: UserPaperNoteCreate,
    user: AuthUser = Depends(get_current_user),
):
    """Create or update note for paper"""
    return await user_service.save_note(user.id, paper_id, data.note_text)


@router.get("/me/notes/{paper_id}", response_model=UserPaperNote)
async def get_note(
    paper_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    """Get note for paper"""
    note = await user_service.get_note(user.id, paper_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No note found for this paper",
        )
    return note


@router.delete("/me/notes/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_note(
    paper_id: UUID,
    user: AuthUser = Depends(get_current_user),
):
    """Delete note for paper"""
    await user_service.delete_note(user.id, paper_id)
