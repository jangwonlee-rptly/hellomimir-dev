"""
LLM service for generating summaries, quizzes, and pre-reading materials
Uses OpenAI GPT-4o-mini for all generation tasks
"""
import json
from typing import Dict
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.logging import get_logger
from app.db.models import (
    ReadingLevel,
    QuizData,
    QuizQuestion,
    SummariesResult,
    PrereadingResult,
    JargonEntry,
    PrerequisiteEntry,
    DifficultyLevel,
)

logger = get_logger(__name__)


class LLMService:
    """Service for LLM-based content generation"""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
        self.model = "gpt-4o-mini"

    # ========== Summaries ==========

    SYSTEM_PROMPT = (
        "You are a science communicator who explains complex research clearly "
        "at a specified reading level. Stay factually accurate and avoid "
        "hallucinating details not present in the original text."
    )

    SUMMARY_PROMPTS: Dict[ReadingLevel, str] = {
        "grade5": (
            "Explain the following academic paper to a 5th-grade student using simple "
            "everyday words and short sentences. Avoid technical jargon; if you must "
            "use a technical term, briefly explain it. Focus on: what the paper is about, "
            "why it matters, and the big idea. Use 3–5 short paragraphs."
        ),
        "middle": (
            "Explain the following academic paper to a middle school student (around 12–15 years old). "
            "You can use some technical terms, but briefly explain them in simple words. "
            "Cover: what problem the paper solves, why it's important, and roughly how it solves it. "
            "Use 3–6 paragraphs."
        ),
        "high": (
            "Explain the following academic paper to a high school student (16–18 years old) "
            "with good reading skills but no domain expertise. You can use more technical vocabulary, "
            "but avoid dense math. Make sure to explain:\n"
            "- What problem the paper addresses\n"
            "- Why the problem matters\n"
            "- The main idea behind the solution\n"
            "- Any key results or findings\n"
            "Use 4–7 paragraphs."
        ),
    }

    async def generate_summary(self, title: str, abstract: str, level: ReadingLevel) -> str:
        """Generate a single summary at a specific reading level"""
        user_prompt = f"{self.SUMMARY_PROMPTS[level]}\n\nTitle: {title}\nAbstract: {abstract}"

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=1500,
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")

            logger.info(f"Generated {level} summary")
            return content.strip()
        except Exception as e:
            logger.error(f"Error generating {level} summary: {e}")
            raise

    async def generate_all_summaries(self, title: str, abstract: str) -> SummariesResult:
        """Generate summaries at all three reading levels"""
        logger.info("Generating all summaries...")

        grade5 = await self.generate_summary(title, abstract, "grade5")
        middle = await self.generate_summary(title, abstract, "middle")
        high = await self.generate_summary(title, abstract, "high")

        return SummariesResult(grade5=grade5, middle=middle, high=high)

    # ========== Quiz ==========

    QUIZ_PROMPT = """Create a quiz to test understanding of this paper's main ideas.
Generate 6–8 multiple-choice questions.
Each question must have exactly 4 options and 1 correct answer.
The incorrect options should be plausible but clearly wrong.
After each question, provide a short explanation for why the correct answer is right.
Output your answer as **strict JSON** with this structure:

{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string"
    }
  ]
}

Only output valid JSON. Do not include any extra text."""

    async def generate_quiz(self, title: str, abstract: str) -> QuizData:
        """Generate a quiz for the paper"""
        user_prompt = f"{self.QUIZ_PROMPT}\n\nTitle: {title}\nAbstract: {abstract}"

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=3000,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")

            parsed = json.loads(content)

            # Validate and convert to QuizData
            if "questions" not in parsed or not isinstance(parsed["questions"], list):
                raise ValueError("Invalid quiz structure: missing questions array")

            questions = []
            for q in parsed["questions"]:
                if len(q["options"]) != 4:
                    raise ValueError(f"Question must have exactly 4 options, got {len(q['options'])}")

                questions.append(
                    QuizQuestion(
                        question=q["question"],
                        options=q["options"],
                        correct_index=q["correct_index"],
                        explanation=q["explanation"],
                    )
                )

            logger.info(f"Generated quiz with {len(questions)} questions")
            return QuizData(questions=questions)
        except Exception as e:
            logger.error(f"Error generating quiz: {e}")
            raise

    # ========== Pre-reading ==========

    PREREADING_PROMPT = """Analyze this academic paper and create comprehensive pre-reading materials to help readers prepare.

Your task is to:
1. Identify 5-10 key technical terms (jargon) with clear, accessible definitions
2. List 3-5 prerequisite concepts readers should understand beforehand
3. Assess the difficulty level for a general scientific audience
4. Estimate reading time based on paper length and complexity
5. Extract 5-8 key concepts covered in the paper

Output your answer as **strict JSON** with this structure:

{
  "jargon": [
    {
      "term": "string",
      "definition": "string",
      "example_usage": "string (optional)"
    }
  ],
  "prerequisites": [
    {
      "concept": "string",
      "why_needed": "string",
      "resources": ["string"] (optional array)
    }
  ],
  "difficulty_level": "beginner" | "intermediate" | "advanced" | "expert",
  "estimated_read_time_minutes": number,
  "key_concepts": ["string"]
}

Only output valid JSON. Do not include any extra text."""

    async def generate_prereading(
        self, title: str, abstract: str, full_text: str, field_name: str
    ) -> PrereadingResult:
        """Generate pre-reading materials for a paper"""
        # Truncate full text to avoid token limits (~30k tokens ≈ 120k chars)
        truncated_text = full_text[:120000] + ("..." if len(full_text) > 120000 else "")

        user_prompt = (
            f"{self.PREREADING_PROMPT}\n\n"
            f"Field: {field_name}\n"
            f"Title: {title}\n"
            f"Abstract: {abstract}\n\n"
            f"Full Paper Text (first ~30k tokens):\n{truncated_text}"
        )

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert educator who helps readers prepare for complex academic papers.",
                    },
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.5,
                max_tokens=3000,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from OpenAI")

            parsed = json.loads(content)

            # Debug logging to see what we got from OpenAI
            logger.info(f"Parsed JSON from OpenAI: difficulty_level type={type(parsed.get('difficulty_level'))}, value={parsed.get('difficulty_level')}")

            # Convert to PrereadingResult
            jargon = [JargonEntry(**j) for j in parsed["jargon"]]
            prerequisites = [PrerequisiteEntry(**p) for p in parsed["prerequisites"]]

            result = PrereadingResult(
                jargon=jargon,
                prerequisites=prerequisites,
                difficulty_level=parsed["difficulty_level"],  # Pydantic validates Literal types
                estimated_read_time_minutes=parsed["estimated_read_time_minutes"],
                key_concepts=parsed["key_concepts"],
            )

            logger.info(
                f"Generated prereading: {len(jargon)} jargon terms, "
                f"{len(prerequisites)} prerequisites, "
                f"difficulty: {result.difficulty_level}"
            )
            return result
        except Exception as e:
            logger.error(f"Error generating prereading: {e}")
            raise


# Global LLM service instance
llm_service = LLMService()
