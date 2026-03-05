-- Fix RLS UPDATE policies: add WITH CHECK to ensure user_id cannot be changed
-- Also add atomic increment function for scrape job counter

-- canvas_nodes: DROP and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own canvas nodes" ON canvas_nodes;
CREATE POLICY "Users can update their own canvas nodes"
  ON canvas_nodes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- canvas_edges: DROP and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own canvas edges" ON canvas_edges;
CREATE POLICY "Users can update their own canvas edges"
  ON canvas_edges FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- scrape_jobs: DROP and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own scrape jobs" ON scrape_jobs;
CREATE POLICY "Users can update their own scrape jobs"
  ON scrape_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- profile_analysis_jobs: DROP and recreate UPDATE policy with WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile analysis jobs" ON profile_analysis_jobs;
CREATE POLICY "Users can update their own profile analysis jobs"
  ON profile_analysis_jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Atomic increment function for scrape job handles_completed counter
CREATE OR REPLACE FUNCTION increment_handles_completed(p_job_id uuid)
RETURNS void AS $$
  UPDATE scrape_jobs SET handles_completed = handles_completed + 1 WHERE id = p_job_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Atomic increment function for scrape job posts_found counter
CREATE OR REPLACE FUNCTION increment_posts_found(p_job_id uuid, p_count integer)
RETURNS void AS $$
  UPDATE scrape_jobs SET posts_found = posts_found + p_count WHERE id = p_job_id;
$$ LANGUAGE sql SECURITY DEFINER;
