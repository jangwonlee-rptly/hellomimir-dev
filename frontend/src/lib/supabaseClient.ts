import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import type {
  Field,
  Paper,
  DailyPaper,
  PaperSummary,
  PaperQuiz,
  PaperPrereading,
  ReadingLevel,
  ArchiveEntry,
  QuizData,
  JargonEntry,
  PrerequisiteEntry,
  DifficultyLevel,
} from "@/types";

// Frontend Supabase client with anonymous key (read-only operations)
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Browser client for auth (singleton pattern)
// Using ReturnType to properly type the client from @supabase/ssr
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getAuthClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  browserClient = createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
}

// Get all fields
export async function getFields(): Promise<Field[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .order("name");

  if (error) {
    console.error("Error fetching fields:", error);
    throw error;
  }

  return data || [];
}

// Get field by slug
export async function getFieldBySlug(slug: string): Promise<Field | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("fields")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching field:", error);
    throw error;
  }

  return data;
}

// Get paper by arXiv ID
export async function getPaperByArxivId(
  arxivId: string
): Promise<Paper | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("papers")
    .select("*")
    .eq("arxiv_id", arxivId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching paper:", error);
    throw error;
  }

  return data;
}

// Get paper by ID
export async function getPaperById(id: string): Promise<Paper | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("papers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching paper:", error);
    throw error;
  }

  return data;
}

// Upsert paper (insert or update)
export async function upsertPaper(
  paper: Omit<Paper, "id" | "created_at">
): Promise<Paper> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("papers")
    .upsert(paper, { onConflict: "arxiv_id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting paper:", error);
    throw error;
  }

  return data;
}

// Get daily paper for a field and date
export async function getDailyPaper(
  fieldId: string,
  date: string
): Promise<DailyPaper | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("daily_papers")
    .select("*")
    .eq("field_id", fieldId)
    .eq("date", date)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching daily paper:", error);
    throw error;
  }

  return data;
}

// Get all paper IDs that have been used for a field
export async function getUsedPaperArxivIds(fieldId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("daily_papers")
    .select("paper_id, papers!inner(arxiv_id)")
    .eq("field_id", fieldId);

  if (error) {
    console.error("Error fetching used papers:", error);
    throw error;
  }

  // Extract arxiv_ids from the joined data
  return (
    data?.map((item) => {
      const papers = item.papers as unknown as { arxiv_id: string };
      return papers.arxiv_id;
    }) || []
  );
}

// Create daily paper entry
export async function createDailyPaper(
  date: string,
  fieldId: string,
  paperId: string
): Promise<DailyPaper> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("daily_papers")
    .insert({ date, field_id: fieldId, paper_id: paperId })
    .select()
    .single();

  if (error) {
    console.error("Error creating daily paper:", error);
    throw error;
  }

  return data;
}

// Get summaries for a paper and field
export async function getPaperSummaries(
  paperId: string,
  fieldId: string
): Promise<Record<ReadingLevel, string>> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("paper_summaries")
    .select("*")
    .eq("paper_id", paperId)
    .eq("field_id", fieldId);

  if (error) {
    console.error("Error fetching summaries:", error);
    throw error;
  }

  const summaries: Record<ReadingLevel, string> = {
    grade5: "",
    middle: "",
    high: "",
  };

  data?.forEach((summary: PaperSummary) => {
    summaries[summary.level as ReadingLevel] = summary.summary_text;
  });

  return summaries;
}

// Create paper summary
export async function createPaperSummary(
  paperId: string,
  fieldId: string,
  level: ReadingLevel,
  summaryText: string
): Promise<PaperSummary> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("paper_summaries")
    .upsert(
      { paper_id: paperId, field_id: fieldId, level, summary_text: summaryText },
      { onConflict: "paper_id,field_id,level" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating summary:", error);
    throw error;
  }

  return data;
}

// Get quiz for a paper and field
export async function getPaperQuiz(
  paperId: string,
  fieldId: string
): Promise<QuizData | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("paper_quizzes")
    .select("*")
    .eq("paper_id", paperId)
    .eq("field_id", fieldId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    console.error("Error fetching quiz:", error);
    throw error;
  }

  return data?.quiz_json || null;
}

// Create paper quiz
export async function createPaperQuiz(
  paperId: string,
  fieldId: string,
  quizJson: QuizData
): Promise<PaperQuiz> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("paper_quizzes")
    .upsert(
      { paper_id: paperId, field_id: fieldId, quiz_json: quizJson },
      { onConflict: "paper_id,field_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating quiz:", error);
    throw error;
  }

  return data;
}

// Get archive entries for a field
export async function getFieldArchive(fieldId: string): Promise<ArchiveEntry[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("daily_papers")
    .select(
      `
      date,
      papers (
        id,
        title,
        arxiv_id
      )
    `
    )
    .eq("field_id", fieldId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching archive:", error);
    throw error;
  }

  return (
    data?.map((item) => ({
      date: item.date,
      paper: item.papers as unknown as {
        id: string;
        title: string;
        arxiv_id: string;
      },
    })) || []
  );
}

// Check if summaries exist for a paper/field combination
export async function summariesExist(
  paperId: string,
  fieldId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("paper_summaries")
    .select("*", { count: "exact", head: true })
    .eq("paper_id", paperId)
    .eq("field_id", fieldId);

  if (error) {
    console.error("Error checking summaries:", error);
    return false;
  }

  return (count || 0) >= 3;
}

// Check if quiz exists for a paper/field combination
export async function quizExists(
  paperId: string,
  fieldId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("paper_quizzes")
    .select("*", { count: "exact", head: true })
    .eq("paper_id", paperId)
    .eq("field_id", fieldId);

  if (error) {
    console.error("Error checking quiz:", error);
    return false;
  }

  return (count || 0) > 0;
}

// ========== Pre-reading Material Functions ==========

// Update paper full text (OCR-extracted content)
export async function updatePaperFullText(
  paperId: string,
  fullText: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("papers")
    .update({ full_text: fullText })
    .eq("id", paperId);

  if (error) {
    console.error("Error updating paper full text:", error);
    throw error;
  }
}

// Get pre-reading materials for a paper and field
export async function getPrereading(
  paperId: string,
  fieldId: string
): Promise<PaperPrereading | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("paper_prereading")
    .select("*")
    .eq("paper_id", paperId)
    .eq("field_id", fieldId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching prereading:", error);
    throw error;
  }

  return data;
}

// Create pre-reading materials for a paper
export async function createPaperPrereading(
  paperId: string,
  fieldId: string,
  jargon: JargonEntry[],
  prerequisites: PrerequisiteEntry[],
  difficultyLevel: DifficultyLevel,
  estimatedReadTime: number,
  keyConcepts: string[]
): Promise<PaperPrereading> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("paper_prereading")
    .upsert(
      {
        paper_id: paperId,
        field_id: fieldId,
        jargon_json: jargon,
        prerequisites_json: prerequisites,
        difficulty_level: difficultyLevel,
        estimated_read_time_minutes: estimatedReadTime,
        key_concepts: keyConcepts,
      },
      { onConflict: "paper_id,field_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating prereading:", error);
    throw error;
  }

  return data;
}

// Check if pre-reading materials exist for a paper/field combination
export async function prereadingExists(
  paperId: string,
  fieldId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("paper_prereading")
    .select("*", { count: "exact", head: true })
    .eq("paper_id", paperId)
    .eq("field_id", fieldId);

  if (error) {
    console.error("Error checking prereading:", error);
    return false;
  }

  return (count || 0) > 0;
}
