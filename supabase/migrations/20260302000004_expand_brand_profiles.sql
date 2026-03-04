-- Expand brand_profiles for comprehensive onboarding

ALTER TABLE brand_profiles
  ADD COLUMN display_name text,
  ADD COLUMN creator_type text CHECK (creator_type IN ('solo_creator', 'brand', 'agency')),
  ADD COLUMN primary_platform text,
  ADD COLUMN social_handles jsonb DEFAULT '{}',
  ADD COLUMN inspiration_handles text[] DEFAULT '{}',
  ADD COLUMN tone_descriptors text[] DEFAULT '{}',
  ADD COLUMN tone_formality integer DEFAULT 3,
  ADD COLUMN tone_humor integer DEFAULT 3,
  ADD COLUMN tone_authority integer DEFAULT 3,
  ADD COLUMN creator_archetype text,
  ADD COLUMN sample_content text,
  ADD COLUMN content_pillars text[] DEFAULT '{}',
  ADD COLUMN content_goal text,
  ADD COLUMN content_formats text[] DEFAULT '{}',
  ADD COLUMN preferred_cta text[] DEFAULT '{}',
  ADD COLUMN unique_value_prop text,
  ADD COLUMN audience_problem text,
  ADD COLUMN audience_age_ranges text[] DEFAULT '{}',
  ADD COLUMN audience_gender text,
  ADD COLUMN onboarding_completed_at timestamptz;
