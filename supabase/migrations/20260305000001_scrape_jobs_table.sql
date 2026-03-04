-- Scrape jobs table: replaces in-memory job store for Vercel serverless compatibility
CREATE TABLE scrape_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  handles_total int DEFAULT 0,
  handles_completed int DEFAULT 0,
  posts_found int DEFAULT 0,
  creators_processed text[] DEFAULT '{}',
  errors text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: users can only read/update their own jobs
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scrape jobs"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scrape jobs"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scrape jobs"
  ON scrape_jobs FOR UPDATE
  USING (auth.uid() = user_id);
