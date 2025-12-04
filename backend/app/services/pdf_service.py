"""
PDF extraction service using pypdf
"""
import io
from typing import Optional
from pypdf import PdfReader
import httpx

from app.core.logging import get_logger

logger = get_logger(__name__)


class PDFService:
    """Service for extracting text from PDF files"""

    async def download_pdf(self, url: str) -> bytes:
        """
        Download PDF from URL

        Args:
            url: URL to the PDF file

        Returns:
            PDF content as bytes
        """
        logger.info(f"Downloading PDF from {url}")

        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()

        logger.info(f"Downloaded PDF: {len(response.content)} bytes")
        return response.content

    def extract_text_from_pdf(self, pdf_content: bytes) -> tuple[str, dict]:
        """
        Extract text from PDF using pypdf

        Args:
            pdf_content: PDF file content as bytes

        Returns:
            Tuple of (extracted_text, metadata)
        """
        logger.info("Extracting text from PDF with pypdf...")

        # Create PDF reader from bytes
        pdf_file = io.BytesIO(pdf_content)
        reader = PdfReader(pdf_file)

        # Extract text from all pages
        full_text = ""
        for page in reader.pages:
            full_text += page.extract_text() + "\n\n"

        # Sanitize text to remove problematic characters
        # Remove null bytes - PostgreSQL cannot store \x00 in TEXT fields (22P05 error)
        full_text = full_text.replace('\x00', '')
        # Remove replacement character (often indicates encoding issues)
        full_text = full_text.replace('\ufffd', '')

        # Calculate metadata
        page_count = len(reader.pages)
        character_count = len(full_text)
        word_count = len([word for word in full_text.split() if word.strip()])

        metadata = {
            "page_count": page_count,
            "character_count": character_count,
            "word_count": word_count,
        }

        logger.info(
            f"Extracted {character_count} characters, {word_count} words "
            f"from {page_count} pages"
        )

        return full_text.strip(), metadata

    async def extract_text_from_url(self, pdf_url: str) -> tuple[str, dict]:
        """
        Download and extract text from PDF URL

        Args:
            pdf_url: URL to the PDF file

        Returns:
            Tuple of (extracted_text, metadata)
        """
        pdf_content = await self.download_pdf(pdf_url)
        return self.extract_text_from_pdf(pdf_content)


# Global PDF service instance
pdf_service = PDFService()
