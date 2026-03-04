-- Add personal identity columns to brand_profiles
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS birth_year integer,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS personal_bio text,
  ADD COLUMN IF NOT EXISTS fun_facts text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS early_life text,
  ADD COLUMN IF NOT EXISTS biggest_struggle text,
  ADD COLUMN IF NOT EXISTS defining_moment text;

-- Create creator_stories table
CREATE TABLE IF NOT EXISTS creator_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  emotion text CHECK (emotion IN ('shame', 'pride', 'fear', 'relief', 'anger', 'joy', 'surprise', 'frustration')),
  category text CHECK (category IN ('struggle', 'achievement', 'childhood', 'relationship', 'career', 'turning_point', 'funny', 'lesson')),
  time_period text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies for creator_stories
ALTER TABLE creator_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stories"
  ON creator_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stories"
  ON creator_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
  ON creator_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON creator_stories FOR DELETE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_stories_user_id ON creator_stories(user_id);
