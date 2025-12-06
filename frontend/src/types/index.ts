// Domain types for hellomimir

export interface Field {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  arxiv_query: string;
  created_at: string;
}

export interface Paper {
  id: string;
  arxiv_id: string;
  title: string;
  abstract: string;
  full_text?: string; // OCR-extracted full paper text
  authors_json: string[];
  categories: string[];
  pdf_url: string;
  published_at: string;
  created_at: string;
}

export interface DailyPaper {
  id: string;
  date: string;
  field_id: string;
  paper_id: string;
  created_at: string;
}

export type ReadingLevel = "grade5" | "middle" | "high";

export interface PaperSummary {
  id: string;
  paper_id: string;
  field_id: string;
  level: ReadingLevel;
  summary_text: string;
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
}

export interface QuizData {
  questions: QuizQuestion[];
}

export interface PaperQuiz {
  id: string;
  paper_id: string;
  field_id: string;
  quiz_json: QuizData;
  created_at: string;
}

// Pre-reading material types
export interface JargonEntry {
  term: string;
  definition: string;
  example_usage?: string;
}

export interface PrerequisiteEntry {
  concept: string;
  why_needed: string;
  resources?: string[];
}

export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface PaperPrereading {
  id: string;
  paper_id: string;
  field_id: string;
  jargon_json: JargonEntry[];
  prerequisites_json: PrerequisiteEntry[];
  difficulty_level: DifficultyLevel;
  estimated_read_time_minutes: number | null;
  key_concepts: string[];
  created_at: string;
}

// arXiv API types
export interface ArxivPaper {
  arxivId: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  publishedAt: Date;
  pdfUrl: string;
}

// Combined view types for frontend
export interface DailyPaperWithDetails {
  date: string;
  field: Field;
  paper: Paper;
  summaries: Record<ReadingLevel, string>;
  quiz: QuizData | null;
  prereading: PaperPrereading | null;
}

export interface ArchiveEntry {
  date: string;
  paper: {
    id: string;
    title: string;
    arxiv_id: string;
  };
}

// Quiz result stored in localStorage (legacy - will be replaced by server storage)
export interface QuizResult {
  score: number;
  totalQuestions: number;
  timestamp: string;
  answers: number[];
}

// ========== User Profile Types ==========

export interface UserProfile {
  id: string;
  preferred_field_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileWithField {
  id: string;
  preferred_field_id: string | null;
  preferred_field: Field | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserQuizScore {
  id: string;
  user_id: string;
  paper_id: string;
  field_id: string;
  score: number;
  total_questions: number;
  answers_json: number[];
  completed_at: string;
}

export interface QuizScoreWithDetails {
  id: string;
  paper_id: string;
  paper_title: string;
  paper_arxiv_id: string;
  field_id: string;
  field_name: string;
  score: number;
  total_questions: number;
  completed_at: string;
}

export interface UserPaperNote {
  id: string;
  user_id: string;
  paper_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface UserFavoritePaper {
  id: string;
  user_id: string;
  paper_id: string;
  created_at: string;
}

export interface FavoritePaperWithDetails {
  id: string;
  paper_id: string;
  paper_title: string;
  paper_arxiv_id: string;
  created_at: string;
}

export interface ViewedPaperWithDetails {
  id: string;
  paper_id: string;
  paper_title: string;
  paper_arxiv_id: string;
  field_id: string | null;
  field_name: string | null;
  viewed_at: string;
}
