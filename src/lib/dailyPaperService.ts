import type { Field, Paper, ReadingLevel, ArxivPaper } from "@/types";
import {
  getFields,
  getUsedPaperArxivIds,
  upsertPaper,
  createDailyPaper,
  createPaperSummary,
  createPaperQuiz,
  getDailyPaper,
  summariesExist,
  quizExists,
} from "./supabaseClient";
import {
  fetchArxivPapers,
  filterUnusedPapers,
  selectNewestPaper,
} from "./arxivClient";
import { generateAllSummaries, generateQuiz } from "./llmClient";

// Get today's date in YYYY-MM-DD format (UTC)
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Convert ArxivPaper to database Paper format
function arxivPaperToDbPaper(
  arxivPaper: ArxivPaper
): Omit<Paper, "id" | "created_at"> {
  return {
    arxiv_id: arxivPaper.arxivId,
    title: arxivPaper.title,
    abstract: arxivPaper.abstract,
    authors_json: arxivPaper.authors,
    categories: arxivPaper.categories,
    pdf_url: arxivPaper.pdfUrl,
    published_at: arxivPaper.publishedAt.toISOString(),
  };
}

// Process a single field: fetch paper, generate content, save to DB
export async function processDailyPaperForField(
  field: Field,
  date: string
): Promise<{ success: boolean; paperId?: string; error?: string }> {
  console.log(`Processing field: ${field.name} (${field.slug})`);

  try {
    // Check if we already have a paper for this field/date
    const existingDailyPaper = await getDailyPaper(field.id, date);
    if (existingDailyPaper) {
      console.log(`Daily paper already exists for ${field.slug} on ${date}`);

      // Check if content exists
      const hasSummaries = await summariesExist(
        existingDailyPaper.paper_id,
        field.id
      );
      const hasQuiz = await quizExists(existingDailyPaper.paper_id, field.id);

      if (hasSummaries && hasQuiz) {
        return { success: true, paperId: existingDailyPaper.paper_id };
      }

      // Need to regenerate missing content - handled below
      console.log(
        `Regenerating content for ${field.slug} (summaries: ${hasSummaries}, quiz: ${hasQuiz})`
      );
    }

    // Step 1: Fetch papers from arXiv
    console.log(`Fetching papers from arXiv for query: ${field.arxiv_query}`);
    const arxivPapers = await fetchArxivPapers(field.arxiv_query, 50);

    if (arxivPapers.length === 0) {
      return { success: false, error: "No papers found on arXiv" };
    }

    // Step 2: Filter out already used papers
    const usedIds = await getUsedPaperArxivIds(field.id);
    const unusedPapers = filterUnusedPapers(arxivPapers, usedIds);

    if (unusedPapers.length === 0) {
      // If all papers have been used, just use any paper
      console.log(
        `All fetched papers have been used for ${field.slug}, selecting from all`
      );
    }

    // Step 3: Select the newest paper
    const selectedPaper = selectNewestPaper(
      unusedPapers.length > 0 ? unusedPapers : arxivPapers
    );

    if (!selectedPaper) {
      return { success: false, error: "Could not select a paper" };
    }

    console.log(`Selected paper: ${selectedPaper.title}`);

    // Step 4: Upsert paper to database
    const dbPaper = await upsertPaper(arxivPaperToDbPaper(selectedPaper));
    console.log(`Paper saved with ID: ${dbPaper.id}`);

    // Step 5: Create daily paper entry (if not exists)
    if (!existingDailyPaper) {
      await createDailyPaper(date, field.id, dbPaper.id);
      console.log(`Daily paper entry created for ${date}`);
    }

    // Step 6: Check and generate summaries
    const hasSummaries = await summariesExist(dbPaper.id, field.id);
    if (!hasSummaries) {
      console.log("Generating summaries...");
      const summaries = await generateAllSummaries(
        dbPaper.title,
        dbPaper.abstract
      );

      const levels: ReadingLevel[] = ["grade5", "middle", "high"];
      for (const level of levels) {
        await createPaperSummary(dbPaper.id, field.id, level, summaries[level]);
      }
      console.log("Summaries saved");
    }

    // Step 7: Check and generate quiz
    const hasQuiz = await quizExists(dbPaper.id, field.id);
    if (!hasQuiz) {
      console.log("Generating quiz...");
      const quiz = await generateQuiz(dbPaper.title, dbPaper.abstract);
      await createPaperQuiz(dbPaper.id, field.id, quiz);
      console.log("Quiz saved");
    }

    return { success: true, paperId: dbPaper.id };
  } catch (error) {
    console.error(`Error processing field ${field.slug}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Process all fields for a given date
export async function processAllFieldsForDate(date: string): Promise<{
  results: Array<{ field: string; success: boolean; error?: string }>;
}> {
  console.log(`\n=== Processing all fields for date: ${date} ===\n`);

  const fields = await getFields();
  const results: Array<{ field: string; success: boolean; error?: string }> = [];

  // Process fields sequentially to respect rate limits
  for (const field of fields) {
    const result = await processDailyPaperForField(field, date);
    results.push({
      field: field.slug,
      success: result.success,
      error: result.error,
    });

    // Small delay between fields
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n=== Processing complete ===");
  console.log("Results:", JSON.stringify(results, null, 2));

  return { results };
}
