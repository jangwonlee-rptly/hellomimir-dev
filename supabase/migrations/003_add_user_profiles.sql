-- User profiles and interaction tables for hellomimir
-- Run this migration in your Supabase SQL editor after enabling Supabase Auth

-- ========================================
-- USER PROFILES TABLE
-- ========================================
-- Extended user information beyond auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    -- Google OAuth uses 'picture', other providers may use 'avatar_url'
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- USER VIEWED PAPERS TABLE
-- ========================================
-- Track which papers users have viewed
CREATE TABLE IF NOT EXISTS user_viewed_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, paper_id)
);

CREATE INDEX IF NOT EXISTS idx_user_viewed_papers_user ON user_viewed_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_viewed_papers_paper ON user_viewed_papers(paper_id);
CREATE INDEX IF NOT EXISTS idx_user_viewed_papers_viewed_at ON user_viewed_papers(user_id, viewed_at DESC);

-- ========================================
-- USER QUIZ SCORES TABLE
-- ========================================
-- Store quiz attempt results
CREATE TABLE IF NOT EXISTS user_quiz_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  answers_json JSONB NOT NULL DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_quiz_scores_user ON user_quiz_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_scores_paper_field ON user_quiz_scores(paper_id, field_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_scores_completed ON user_quiz_scores(user_id, completed_at DESC);

-- ========================================
-- USER PAPER NOTES TABLE
-- ========================================
-- Personal notes on papers
CREATE TABLE IF NOT EXISTS user_paper_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, paper_id)
);

CREATE INDEX IF NOT EXISTS idx_user_paper_notes_user ON user_paper_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_paper_notes_updated ON user_paper_notes(user_id, updated_at DESC);

CREATE TRIGGER update_user_paper_notes_updated_at
  BEFORE UPDATE ON user_paper_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ========================================
-- USER FAVORITE PAPERS TABLE
-- ========================================
-- Bookmarked/saved papers
CREATE TABLE IF NOT EXISTS user_favorite_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, paper_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_papers_user ON user_favorite_papers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_papers_created ON user_favorite_papers(user_id, created_at DESC);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_viewed_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_paper_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_papers ENABLE ROW LEVEL SECURITY;

-- user_profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- user_viewed_papers: Users manage their own view history
CREATE POLICY "Users can view own paper history"
  ON user_viewed_papers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper views"
  ON user_viewed_papers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper views"
  ON user_viewed_papers FOR DELETE
  USING (auth.uid() = user_id);

-- user_quiz_scores: Users manage their own quiz results
CREATE POLICY "Users can view own quiz scores"
  ON user_quiz_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz scores"
  ON user_quiz_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_paper_notes: Users manage their own notes
CREATE POLICY "Users can view own notes"
  ON user_paper_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON user_paper_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON user_paper_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON user_paper_notes FOR DELETE
  USING (auth.uid() = user_id);

-- user_favorite_papers: Users manage their own favorites
CREATE POLICY "Users can view own favorites"
  ON user_favorite_papers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorite_papers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorite_papers FOR DELETE
  USING (auth.uid() = user_id);

-- ========================================
-- SERVICE ROLE POLICIES (for backend access)
-- ========================================
-- Allow service role to bypass RLS for backend operations

CREATE POLICY "Service role has full access to user_profiles"
  ON user_profiles FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_viewed_papers"
  ON user_viewed_papers FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_quiz_scores"
  ON user_quiz_scores FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_paper_notes"
  ON user_paper_notes FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to user_favorite_papers"
  ON user_favorite_papers FOR ALL
  USING (auth.role() = 'service_role');
