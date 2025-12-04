"""
DeepSeek OCR service for extracting text from images in PDFs

This service integrates with Clarifai's OpenAI-compatible DeepSeek OCR API
to extract text, formulas, tables, and diagrams from image regions.
"""
from typing import Literal
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# OCR region types
OCRRegionType = Literal["table", "figure", "formula", "general"]

# OCR prompts for different region types
OCR_PROMPTS = {
    "table": "Extract this table and convert it to Markdown format. Preserve column alignment and all data. If there are formulas in cells, include them.",
    "figure": "Describe this figure or chart in detail. Extract any text labels, axis labels, legends, and captions.",
    "formula": "Extract all mathematical formulas and equations. Use LaTeX notation where appropriate.",
    "general": "Extract all text, formulas, tables, and diagrams. For tables, output as Markdown. Preserve the document structure.",
}


class DeepSeekService:
    """Service for OCR using DeepSeek via Clarifai"""

    def __init__(self):
        """Initialize Clarifai OpenAI client"""
        if not settings.clarifai_api_key:
            logger.warning(
                "CLARIFAI_API_KEY not set. DeepSeek OCR will not be available. "
                "Get one at https://clarifai.com/settings/security"
            )
            self.client = None
        else:
            self.client = AsyncOpenAI(
                base_url="https://api.clarifai.com/v2/ext/openai/v1",
                api_key=settings.clarifai_api_key,
            )

    async def extract_text_from_image(
        self, base64_image: str, region_type: OCRRegionType = "general"
    ) -> str:
        """
        Extract text from a base64-encoded image using DeepSeek OCR

        This uses Clarifai's OpenAI-compatible API to run DeepSeek OCR on image regions.
        DeepSeek OCR is a 3B parameter vision-language model that extracts text,
        formulas, tables, and diagrams from images and converts them to markdown.

        Args:
            base64_image: Base64-encoded image (PNG or JPEG)
            region_type: Type of region (table, figure, formula, or general)

        Returns:
            Extracted text/markdown

        Raises:
            RuntimeError: If CLARIFAI_API_KEY is not set
            Exception: If OCR extraction fails
        """
        if not self.client:
            raise RuntimeError(
                "DeepSeek OCR not available. CLARIFAI_API_KEY not configured."
            )

        prompt = OCR_PROMPTS[region_type]
        logger.info(
            f"Running DeepSeek OCR on {region_type} region "
            f"({len(base64_image)} chars base64)..."
        )

        try:
            # Format: data:image/png;base64,{base64Image}
            image_url = f"data:image/png;base64,{base64_image}"

            response = await self.client.chat.completions.create(
                model="https://clarifai.com/deepseek-ai/deepseek-ocr/models/DeepSeek-OCR",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": image_url},
                            },
                            {
                                "type": "text",
                                "text": prompt,
                            },
                        ],
                    },
                ],
                max_tokens=4000,
                temperature=0.0,
            )

            extracted_text = response.choices[0].message.content or ""

            if not extracted_text or not extracted_text.strip():
                logger.warning(f"Empty text extracted from {region_type} region")
                return ""

            logger.info(
                f"OCR extracted {len(extracted_text)} characters from {region_type} region"
            )

            return extracted_text.strip()

        except Exception as e:
            logger.error(f"Error running OCR on {region_type} region: {e}")
            raise

    async def batch_extract_from_images(
        self,
        regions: list[dict[str, str]],  # [{"base64_image": str, "region_type": str}]
        concurrency: int = 3,
    ) -> list[str]:
        """
        Batch extract text from multiple image regions

        Args:
            regions: List of dicts with "base64_image" and "region_type" keys
            concurrency: Number of concurrent OCR requests (default: 3)

        Returns:
            List of extracted text in same order as input
        """
        import asyncio

        logger.info(
            f"Batch OCR: processing {len(regions)} regions with concurrency {concurrency}"
        )

        results: list[str] = []

        # Process in batches
        for i in range(0, len(regions), concurrency):
            batch = regions[i : i + concurrency]

            async def extract_with_error_handling(region: dict) -> str:
                try:
                    return await self.extract_text_from_image(
                        region["base64_image"], region["region_type"]
                    )
                except Exception as e:
                    logger.error(f"OCR failed for region: {e}")
                    return ""  # Graceful degradation

            batch_results = await asyncio.gather(
                *[extract_with_error_handling(region) for region in batch]
            )

            results.extend(batch_results)

        success_count = sum(1 for r in results if r)
        logger.info(f"Batch OCR complete: {success_count}/{len(regions)} successful")

        return results


# Global DeepSeek service instance
deepseek_service = DeepSeekService()
