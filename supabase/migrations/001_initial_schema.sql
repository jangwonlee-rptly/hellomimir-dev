-- hellomimir database schema
-- Run this migration in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fields table: User-facing categories mapped to arXiv queries
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  arxiv_query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Papers table: Unique arXiv papers
CREATE TABLE IF NOT EXISTS papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arxiv_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  authors_json JSONB NOT NULL DEFAULT '[]',
  categories TEXT[] NOT NULL DEFAULT '{}',
  pdf_url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily papers table: One paper per field per date
CREATE TABLE IF NOT EXISTS daily_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, field_id)
);

-- Paper summaries table: Summaries at different reading levels
CREATE TABLE IF NOT EXISTS paper_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('grade5', 'middle', 'high')),
  summary_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paper_id, field_id, level)
);

-- Paper quizzes table: Quiz JSON for each paper/field combination
CREATE TABLE IF NOT EXISTS paper_quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  quiz_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(paper_id, field_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_daily_papers_date ON daily_papers(date);
CREATE INDEX IF NOT EXISTS idx_daily_papers_field ON daily_papers(field_id);
CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON papers(arxiv_id);
CREATE INDEX IF NOT EXISTS idx_paper_summaries_paper_field ON paper_summaries(paper_id, field_id);
CREATE INDEX IF NOT EXISTS idx_paper_quizzes_paper_field ON paper_quizzes(paper_id, field_id);

-- Seed initial fields
INSERT INTO fields (slug, name, description, arxiv_query) VALUES
  ('ai-ml', 'AI & Machine Learning', 'Artificial intelligence, machine learning, deep learning, and neural networks', 'cat:cs.LG OR cat:cs.AI OR cat:cs.CL OR cat:cs.CV OR cat:stat.ML'),
  ('computer-science', 'Computer Science (General)', 'General computer science including algorithms, systems, and theory', 'cat:cs.*'),
  ('astrophysics', 'Astrophysics', 'Stars, galaxies, cosmology, and the universe', 'cat:astro-ph.*'),
  ('mathematics', 'Mathematics', 'Pure and applied mathematics across all subfields', 'cat:math.*'),
  ('statistics', 'Statistics', 'Statistical theory, methods, and applications', 'cat:stat.*')
ON CONFLICT (slug) DO NOTHING;
