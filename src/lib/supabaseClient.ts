import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  Field,
  Paper,
  DailyPaper,
  PaperSummary,
  PaperQuiz,
  ReadingLevel,
  ArchiveEntry,
  QuizData,
} from "@/types";

// Server-side Supabase client with service role key
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseKey);
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
