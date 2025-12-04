import OpenAI from "openai";
import type { ReadingLevel, QuizData, QuizQuestion } from "@/types";

// Initialize OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `You are a science communicator who explains complex research clearly at a specified reading level. Stay factually accurate and avoid hallucinating details not present in the original text.`;

const SUMMARY_PROMPTS: Record<ReadingLevel, string> = {
  grade5: `Explain the following academic paper to a 5th-grade student using simple everyday words and short sentences.
Avoid technical jargon; if you must use a technical term, briefly explain it.
Focus on: what the paper is about, why it matters, and the big idea.
Use 3–5 short paragraphs.`,

  middle: `Explain the following academic paper to a middle school student (around 12–15 years old).
You can use some technical terms, but briefly explain them in simple words.
Cover: what problem the paper solves, why it's important, and roughly how it solves it.
Use 3–6 paragraphs.`,

  high: `Explain the following academic paper to a high school student (16–18 years old) with good reading skills but no domain expertise.
You can use more technical vocabulary, but avoid dense math.
Make sure to explain:
- What problem the paper addresses
- Why the problem matters
- The main idea behind the solution
- Any key results or findings
Use 4–7 paragraphs.`,
};

const QUIZ_PROMPT = `Create a quiz to test understanding of this paper's main ideas.
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

Only output valid JSON. Do not include any extra text.`;

// Generate summary at a specific reading level
export async function generateSummary(
  title: string,
  abstract: string,
  level: ReadingLevel
): Promise<string> {
  const client = getOpenAIClient();

  const userPrompt = `${SUMMARY_PROMPTS[level]}

Title: ${title}
Abstract: ${abstract}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return content.trim();
  } catch (error) {
    console.error(`Error generating ${level} summary:`, error);
    throw error;
  }
}

// Generate all three summaries for a paper
export async function generateAllSummaries(
  title: string,
  abstract: string
): Promise<Record<ReadingLevel, string>> {
  const levels: ReadingLevel[] = ["grade5", "middle", "high"];

  const summaries = await Promise.all(
    levels.map((level) => generateSummary(title, abstract, level))
  );

  return {
    grade5: summaries[0],
    middle: summaries[1],
    high: summaries[2],
  };
}

// Validate quiz JSON structure
function validateQuizData(data: unknown): data is QuizData {
  if (!data || typeof data !== "object") return false;

  const quiz = data as Record<string, unknown>;
  if (!Array.isArray(quiz.questions)) return false;

  for (const q of quiz.questions) {
    if (typeof q !== "object" || !q) return false;

    const question = q as Record<string, unknown>;
    if (typeof question.question !== "string") return false;
    if (!Array.isArray(question.options) || question.options.length !== 4)
      return false;
    if (!question.options.every((opt: unknown) => typeof opt === "string"))
      return false;
    if (
      typeof question.correct_index !== "number" ||
      question.correct_index < 0 ||
      question.correct_index > 3
    )
      return false;
    if (typeof question.explanation !== "string") return false;
  }

  return true;
}

// Generate quiz for a paper
export async function generateQuiz(
  title: string,
  abstract: string
): Promise<QuizData> {
  const client = getOpenAIClient();

  const userPrompt = `${QUIZ_PROMPT}

Title: ${title}
Abstract: ${abstract}`;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsed = JSON.parse(content);

    if (!validateQuizData(parsed)) {
      throw new Error("Invalid quiz JSON structure from OpenAI");
    }

    // Ensure options are tuples of exactly 4 strings
    const validatedQuiz: QuizData = {
      questions: parsed.questions.map((q: QuizQuestion) => ({
        question: q.question,
        options: [q.options[0], q.options[1], q.options[2], q.options[3]] as [
          string,
          string,
          string,
          string
        ],
        correct_index: q.correct_index,
        explanation: q.explanation,
      })),
    };

    return validatedQuiz;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}
