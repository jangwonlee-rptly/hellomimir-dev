-- Add DeepSeek OCR full text support and pre-reading materials
-- Migration created: 2025-12-04

-- Add full text column to papers table for storing OCR-extracted content
ALTER TABLE papers
ADD COLUMN full_text TEXT;

-- Optional: Full-text search index (can be added later if needed)
-- CREATE INDEX IF NOT EXISTS idx_papers_full_text_search
-- ON papers USING gin(to_tsvector('english', full_text));

-- Pre-reading materials table: Jargon, prerequisites, and reading guidance
CREATE TABLE IF NOT EXISTS paper_prereading (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,

  -- Jargon definitions (array of {term, definition, example_usage?})
  jargon_json JSONB NOT NULL DEFAULT '[]',

  -- Prerequisites (array of {concept, why_needed, resources?})
  prerequisites_json JSONB NOT NULL DEFAULT '[]',

  -- Difficulty assessment
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),

  -- Estimated reading time in minutes
  estimated_read_time_minutes INT,

  -- Key concepts covered in the paper
  key_concepts TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One prereading per paper/field combination
  UNIQUE(paper_id, field_id)
);

-- Index for efficient prereading lookups
CREATE INDEX IF NOT EXISTS idx_paper_prereading_paper_field
ON paper_prereading(paper_id, field_id);

-- Index for difficulty level queries (optional, for future analytics)
CREATE INDEX IF NOT EXISTS idx_paper_prereading_difficulty
ON paper_prereading(difficulty_level);
