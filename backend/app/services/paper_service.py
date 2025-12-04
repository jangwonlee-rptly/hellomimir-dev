"""
Paper ingestion service - orchestrates the full pipeline
"""
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from app.core.logging import get_logger
from app.db.supabase_client import db
from app.db.models import AcademicField, FieldIngestResult, ReadingLevel
from app.services.arxiv_service import arxiv_service
from app.services.llm_service import llm_service
from app.services.pdf_service import pdf_service

logger = get_logger(__name__)


class PaperService:
    """Service for orchestrating paper ingestion pipeline"""

    def get_today_date(self) -> str:
        """Get today's date in YYYY-MM-DD format (UTC)"""
        return datetime.now(timezone.utc).strftime("%Y-%m-%d")

    async def ingest_paper_for_field(
        self, field: AcademicField, date: str
    ) -> FieldIngestResult:
        """
        Ingest a paper for a specific field and date

        This is the main ingestion pipeline that:
        1. Fetches papers from arXiv
        2. Selects an unused paper
        3. Stores paper metadata
        4. Generates summaries and quiz from abstract
        5. (Optional) Generates pre-reading materials if full text available

        Args:
            field: Field to ingest paper for
            date: Date string in YYYY-MM-DD format

        Returns:
            FieldIngestResult with success status and details
        """
        logger.info(f"Processing field: {field.name} ({field.slug})")

        try:
            # Check if we already have a paper for this field/date
            existing_daily_paper = await db.get_daily_paper(field.id, date)
            if existing_daily_paper:
                logger.info(f"Daily paper already exists for {field.slug} on {date}")

                # Check if content exists
                has_summaries = await db.summaries_exist(
                    existing_daily_paper.paper_id, field.id
                )
                has_quiz = await db.quiz_exists(existing_daily_paper.paper_id, field.id)
                has_prereading = await db.prereading_exists(
                    existing_daily_paper.paper_id, field.id
                )

                if has_summaries and has_quiz and has_prereading:
                    logger.info(f"All content exists for {field.slug}, skipping")
                    return FieldIngestResult(
                        field_slug=field.slug,
                        success=True,
                        paper_id=existing_daily_paper.paper_id,
                    )

                logger.info(
                    f"Regenerating missing content for {field.slug} "
                    f"(summaries: {has_summaries}, quiz: {has_quiz}, prereading: {has_prereading})"
                )

            # Step 1: Fetch papers from arXiv
            logger.info(f"Fetching papers from arXiv: {field.arxiv_query}")
            arxiv_papers = await arxiv_service.fetch_papers(field.arxiv_query, max_results=50)

            if not arxiv_papers:
                return FieldIngestResult(
                    field_slug=field.slug,
                    success=False,
                    error="No papers found on arXiv",
                )

            # Step 2: Filter out already used papers
            used_ids = await db.get_used_paper_arxiv_ids(field.id)
            unused_papers = arxiv_service.filter_unused_papers(arxiv_papers, used_ids)

            if not unused_papers:
                logger.info(
                    f"All fetched papers have been used for {field.slug}, selecting from all"
                )
                unused_papers = arxiv_papers

            # Step 3: Select the newest paper
            selected_paper = arxiv_service.select_newest_paper(unused_papers)
            if not selected_paper:
                return FieldIngestResult(
                    field_slug=field.slug,
                    success=False,
                    error="Could not select a paper",
                )

            logger.info(f"Selected paper: {selected_paper.title} ({selected_paper.arxiv_id})")

            # Step 4: Upsert paper to database
            paper_data = {
                "arxiv_id": selected_paper.arxiv_id,
                "title": selected_paper.title,
                "abstract": selected_paper.abstract,
                "authors_json": selected_paper.authors,
                "categories": selected_paper.categories,
                "pdf_url": selected_paper.pdf_url,
                "published_at": selected_paper.published_at.isoformat(),
            }
            db_paper = await db.upsert_paper(paper_data)
            logger.info(f"Paper saved with ID: {db_paper.id}")

            # Step 4.5: PDF extraction
            logger.info("Extracting full text from PDF...")
            try:
                full_text, pdf_metadata = await pdf_service.extract_text_from_url(
                    db_paper.pdf_url
                )

                if full_text and len(full_text.strip()) > 100:  # Minimum viable text
                    await db.update_paper_full_text(db_paper.id, full_text)
                    db_paper.full_text = full_text
                    logger.info(
                        f"PDF extraction complete: {pdf_metadata['page_count']} pages, "
                        f"{pdf_metadata['character_count']} characters, "
                        f"{pdf_metadata['word_count']} words"
                    )
                else:
                    logger.warning("PDF extraction yielded insufficient text, skipping")
            except Exception as e:
                logger.error(f"PDF extraction failed: {e}")
                logger.info("Continuing with abstract-only mode")

            # Step 5: Create daily paper entry (if not exists)
            if not existing_daily_paper:
                await db.create_daily_paper(date, field.id, db_paper.id)
                logger.info(f"Daily paper entry created for {date}")

            # Step 5.5: Generate pre-reading materials (if full text available)
            has_prereading = await db.prereading_exists(db_paper.id, field.id)
            if not has_prereading and db_paper.full_text:
                logger.info("Generating pre-reading materials...")
                try:
                    prereading = await llm_service.generate_prereading(
                        db_paper.title,
                        db_paper.abstract,
                        db_paper.full_text,
                        field.name,
                    )
                    await db.create_paper_prereading(
                        db_paper.id,
                        field.id,
                        prereading.jargon,
                        prereading.prerequisites,
                        prereading.difficulty_level,
                        prereading.estimated_read_time_minutes,
                        prereading.key_concepts,
                    )
                    logger.info("Pre-reading materials saved")
                except Exception as e:
                    logger.error(f"Failed to generate pre-reading materials: {e}")
                    # Continue - prereading is optional
            elif not has_prereading:
                logger.info("Skipping pre-reading generation (no full text available)")

            # Step 6: Check and generate summaries
            has_summaries = await db.summaries_exist(db_paper.id, field.id)
            if not has_summaries:
                logger.info("Generating summaries...")
                summaries = await llm_service.generate_all_summaries(
                    db_paper.title, db_paper.abstract
                )

                levels: List[ReadingLevel] = ["grade5", "middle", "high"]
                for level in levels:
                    summary_text = getattr(summaries, level)
                    await db.create_paper_summary(db_paper.id, field.id, level, summary_text)

                logger.info("Summaries saved")

            # Step 7: Check and generate quiz
            has_quiz = await db.quiz_exists(db_paper.id, field.id)
            if not has_quiz:
                logger.info("Generating quiz...")
                quiz = await llm_service.generate_quiz(db_paper.title, db_paper.abstract)
                await db.create_paper_quiz(db_paper.id, field.id, quiz)
                logger.info("Quiz saved")

            return FieldIngestResult(
                field_slug=field.slug,
                success=True,
                paper_id=db_paper.id,
                arxiv_id=db_paper.arxiv_id,
            )

        except Exception as e:
            logger.error(f"Error processing field {field.slug}: {e}", exc_info=True)
            return FieldIngestResult(
                field_slug=field.slug,
                success=False,
                error=str(e),
            )

    async def ingest_daily_papers(self, date: Optional[str] = None) -> List[FieldIngestResult]:
        """
        Process all fields for a given date

        Args:
            date: Date string in YYYY-MM-DD format, defaults to today

        Returns:
            List of FieldIngestResult for each field
        """
        if not date:
            date = self.get_today_date()

        logger.info(f"\n=== Processing all fields for date: {date} ===\n")

        fields = await db.get_fields()
        results: List[FieldIngestResult] = []

        # Process fields sequentially to respect rate limits
        for field in fields:
            result = await self.ingest_paper_for_field(field, date)
            results.append(result)

            # Small delay between fields (rate limiting)
            import asyncio
            await asyncio.sleep(1.0)

        logger.info("\n=== Processing complete ===")
        success_count = sum(1 for r in results if r.success)
        fail_count = len(results) - success_count
        logger.info(f"Success: {success_count}, Failed: {fail_count}")

        return results


# Global paper service instance
paper_service = PaperService()
