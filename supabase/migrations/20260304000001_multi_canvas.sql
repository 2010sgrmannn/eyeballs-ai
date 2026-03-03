-- Multi-canvas support: canvases table + canvas_id on nodes/edges

-- 1. Create canvases table
create table if not exists public.canvases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Canvas',
  brief jsonb default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_canvases_user_id on public.canvases(user_id);
create index idx_canvases_updated_at on public.canvases(updated_at desc);

-- RLS for canvases
alter table public.canvases enable row level security;

create policy "Users can view own canvases"
  on public.canvases for select
  using (auth.uid() = user_id);

create policy "Users can create own canvases"
  on public.canvases for insert
  with check (auth.uid() = user_id);

create policy "Users can update own canvases"
  on public.canvases for update
  using (auth.uid() = user_id);

create policy "Users can delete own canvases"
  on public.canvases for delete
  using (auth.uid() = user_id);

-- 2. Add canvas_id column to canvas_nodes and canvas_edges (nullable first)
alter table public.canvas_nodes add column canvas_id uuid references public.canvases(id) on delete cascade;
alter table public.canvas_edges add column canvas_id uuid references public.canvases(id) on delete cascade;

-- 3. Backfill: create a default canvas per user and link existing nodes/edges
do $$
declare
  u record;
  new_canvas_id uuid;
begin
  for u in
    select distinct user_id from public.canvas_nodes
    union
    select distinct user_id from public.canvas_edges
  loop
    insert into public.canvases (user_id, name)
    values (u.user_id, 'My Canvas')
    returning id into new_canvas_id;

    update public.canvas_nodes
    set canvas_id = new_canvas_id
    where user_id = u.user_id and canvas_id is null;

    update public.canvas_edges
    set canvas_id = new_canvas_id
    where user_id = u.user_id and canvas_id is null;
  end loop;
end $$;

-- 4. Make canvas_id NOT NULL + add indexes
alter table public.canvas_nodes alter column canvas_id set not null;
alter table public.canvas_edges alter column canvas_id set not null;

create index idx_canvas_nodes_canvas_id on public.canvas_nodes(canvas_id);
create index idx_canvas_edges_canvas_id on public.canvas_edges(canvas_id);

-- Updated at trigger for canvases
create or replace function update_canvases_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger canvases_updated_at
  before update on public.canvases
  for each row execute function update_canvases_updated_at();
