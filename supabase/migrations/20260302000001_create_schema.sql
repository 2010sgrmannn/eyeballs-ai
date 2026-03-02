-- Migration: Create full database schema for eyeballs-ai
-- Tables: brand_profiles, creators, content, content_tags, niches, scripts
-- All tables have RLS enabled with user-scoped policies

-- =============================================================================
-- 1. brand_profiles
-- =============================================================================
CREATE TABLE brand_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_voice text,
  "values" text[],
  target_audience text,
  content_style text,
  niche text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own brand_profiles"
  ON brand_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand_profiles"
  ON brand_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand_profiles"
  ON brand_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand_profiles"
  ON brand_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. creators
-- =============================================================================
CREATE TABLE creators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'linkedin', 'twitter')),
  handle text NOT NULL,
  display_name text,
  follower_count integer,
  scraped_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform, handle)
);

ALTER TABLE creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own creators"
  ON creators FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creators"
  ON creators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own creators"
  ON creators FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own creators"
  ON creators FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. content
-- =============================================================================
CREATE TABLE content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  platform text,
  external_id text,
  content_type text,
  caption text,
  transcript text,
  thumbnail_url text,
  media_url text,
  view_count integer,
  like_count integer,
  comment_count integer,
  share_count integer,
  engagement_ratio numeric,
  virality_score numeric,
  hook_text text,
  cta_text text,
  posted_at timestamptz,
  analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_id, external_id)
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own content"
  ON content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content"
  ON content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content"
  ON content FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content"
  ON content FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 4. content_tags
-- =============================================================================
CREATE TABLE content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  tag text NOT NULL,
  category text CHECK (category IN ('niche', 'topic', 'style', 'hook_type', 'emotion')),
  UNIQUE (content_id, tag)
);

-- content_tags does not have a direct user_id column, so RLS joins through content
ALTER TABLE content_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own content_tags"
  ON content_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_tags.content_id
        AND content.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own content_tags"
  ON content_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_tags.content_id
        AND content.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own content_tags"
  ON content_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_tags.content_id
        AND content.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_tags.content_id
        AND content.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own content_tags"
  ON content_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM content
      WHERE content.id = content_tags.content_id
        AND content.user_id = auth.uid()
    )
  );

-- =============================================================================
-- 5. niches
-- =============================================================================
CREATE TABLE niches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE niches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own niches"
  ON niches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own niches"
  ON niches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own niches"
  ON niches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own niches"
  ON niches FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 6. scripts
-- =============================================================================
CREATE TABLE scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  topic text,
  script_body text,
  niche_id uuid REFERENCES niches(id) ON DELETE SET NULL,
  source_content_ids uuid[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own scripts"
  ON scripts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scripts"
  ON scripts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scripts"
  ON scripts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scripts"
  ON scripts FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- Indexes for common query patterns
-- =============================================================================
CREATE INDEX idx_brand_profiles_user_id ON brand_profiles(user_id);
CREATE INDEX idx_creators_user_id ON creators(user_id);
CREATE INDEX idx_content_user_id ON content(user_id);
CREATE INDEX idx_content_creator_id ON content(creator_id);
CREATE INDEX idx_content_tags_content_id ON content_tags(content_id);
CREATE INDEX idx_niches_user_id ON niches(user_id);
CREATE INDEX idx_scripts_user_id ON scripts(user_id);
CREATE INDEX idx_scripts_niche_id ON scripts(niche_id);
