-- Profile analysis: new table + columns for reel classification and bio storage

-- 1. Add reel_type to content table
alter table content add column if not exists reel_type text null;

-- 2. Add bio and profile_pic_url to creators table
alter table creators add column if not exists bio text null;
alter table creators add column if not exists profile_pic_url text null;

-- 3. Create profile_analysis_jobs table
create table if not exists profile_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  handle text not null,
  status text not null default 'pending',
  reels_requested int not null,
  reels_scraped int default 0,
  reels_transcribed int default 0,
  reels_classified int default 0,
  brand_dna jsonb null,
  errors text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Enable RLS
alter table profile_analysis_jobs enable row level security;

-- 5. RLS policies for profile_analysis_jobs
create policy "Users can read own profile analysis jobs"
  on profile_analysis_jobs for select
  using (auth.uid() = user_id);

create policy "Users can insert own profile analysis jobs"
  on profile_analysis_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile analysis jobs"
  on profile_analysis_jobs for update
  using (auth.uid() = user_id);
