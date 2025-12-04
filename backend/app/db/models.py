"""
Pydantic models for database entities and API schemas
"""
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from uuid import UUID


# Type aliases
ReadingLevel = Literal["grade5", "middle", "high"]
DifficultyLevel = Literal["beginner", "intermediate", "advanced", "expert"]


# ========== Database Models ==========

class AcademicField(BaseModel):
    """Field/category for academic papers"""
    id: UUID
    slug: str
    name: str
    description: Optional[str]
    arxiv_query: str
    created_at: datetime


class Paper(BaseModel):
    """Academic paper from arXiv"""
    id: UUID
    arxiv_id: str
    title: str
    abstract: str
    full_text: Optional[str] = None
    authors_json: List[str]
    categories: List[str]
    pdf_url: str
    published_at: datetime
    created_at: datetime


class DailyPaper(BaseModel):
    """Daily paper assignment for a field"""
    id: UUID
    date: str  # YYYY-MM-DD format
    field_id: UUID
    paper_id: UUID
    created_at: datetime


class PaperSummary(BaseModel):
    """Paper summary at a specific reading level"""
    id: UUID
    paper_id: UUID
    field_id: UUID
    level: ReadingLevel
    summary_text: str
    created_at: datetime


class QuizQuestion(BaseModel):
    """Single quiz question"""
    question: str
    options: List[str]
    correct_index: int = Field(ge=0, le=3)
    explanation: str

    @field_validator('options')
    @classmethod
    def validate_options_length(cls, v):
        if len(v) != 4:
            raise ValueError('options must have exactly 4 items')
        return v


class QuizData(BaseModel):
    """Complete quiz with multiple questions"""
    questions: List[QuizQuestion]


class PaperQuiz(BaseModel):
    """Quiz for a paper"""
    id: UUID
    paper_id: UUID
    field_id: UUID
    quiz_json: QuizData
    created_at: datetime


class JargonEntry(BaseModel):
    """Technical term with definition"""
    term: str
    definition: str
    example_usage: Optional[str] = None


class PrerequisiteEntry(BaseModel):
    """Prerequisite concept for understanding the paper"""
    concept: str
    why_needed: str
    resources: Optional[List[str]] = None


class PaperPrereading(BaseModel):
    """Pre-reading materials for a paper"""
    id: UUID
    paper_id: UUID
    field_id: UUID
    jargon_json: List[JargonEntry]
    prerequisites_json: List[PrerequisiteEntry]
    difficulty_level: DifficultyLevel
    estimated_read_time_minutes: Optional[int]
    key_concepts: List[str]
    created_at: datetime


# ========== arXiv Models ==========

class ArxivPaper(BaseModel):
    """Paper from arXiv API"""
    arxiv_id: str
    title: str
    abstract: str
    authors: List[str]
    categories: List[str]
    published_at: datetime
    pdf_url: str


# ========== Request/Response Models ==========

class IngestPaperRequest(BaseModel):
    """Request to ingest a specific paper"""
    arxiv_id: str


class IngestDailyRequest(BaseModel):
    """Request to run daily ingestion"""
    date: Optional[str] = None  # YYYY-MM-DD format, defaults to today


class FieldIngestResult(BaseModel):
    """Result of ingesting a paper for a field"""
    field_slug: str
    success: bool
    paper_id: Optional[UUID] = None
    arxiv_id: Optional[str] = None
    error: Optional[str] = None


class IngestResultSchema(BaseModel):
    """Result of ingestion operation"""
    message: str
    date: str
    success_count: int
    fail_count: int
    results: List[FieldIngestResult]


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    version: str


class StatusResponse(BaseModel):
    """Status endpoint response with additional info"""
    status: str
    timestamp: datetime
    version: str
    database_connected: bool
    services: dict


# ========== Service Response Models ==========

class SummariesResult(BaseModel):
    """Result of generating all summaries"""
    grade5: str
    middle: str
    high: str


class PrereadingResult(BaseModel):
    """Result of generating pre-reading materials"""
    jargon: List[JargonEntry]
    prerequisites: List[PrerequisiteEntry]
    difficulty_level: DifficultyLevel
    estimated_read_time_minutes: int
    key_concepts: List[str]
