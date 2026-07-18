-- RentClock AI SEO workspace
-- Applied to the live RentClock Supabase project on 2026-07-17.

create table if not exists public.seo_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.seo_admins enable row level security;
revoke all on table public.seo_admins from anon, authenticated;

create table if not exists public.seo_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  primary_keyword text not null,
  search_intent text not null default 'informational',
  page_type text not null default 'guide',
  priority integer not null default 50 check (priority between 1 and 100),
  status text not null default 'backlog' check (status in ('backlog','drafting','ready','published','archived')),
  source_url text,
  notes text,
  draft jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_opportunities_status_priority_idx
  on public.seo_opportunities (status, priority desc, created_at desc);

alter table public.seo_opportunities enable row level security;
revoke all on table public.seo_opportunities from anon, authenticated;

create policy "service role manages seo admins"
  on public.seo_admins for all to service_role
  using (true)
  with check (true);

create policy "service role manages seo opportunities"
  on public.seo_opportunities for all to service_role
  using (true)
  with check (true);

-- Google Search Console OAuth connection (read-only scope)
create table if not exists public.search_console_connections (
  owner_email text primary key references public.seo_admins(email) on delete cascade,
  refresh_token_encrypted text not null,
  google_email text,
  properties jsonb not null default '[]'::jsonb,
  selected_property text,
  connected_at timestamptz not null default now(),
  last_imported_at timestamptz
);
alter table public.search_console_connections enable row level security;
revoke all on table public.search_console_connections from anon, authenticated;
create policy "service role manages search console connections"
  on public.search_console_connections for all to service_role
  using (true) with check (true);

create table if not exists public.search_console_oauth_states (
  state text primary key,
  owner_email text not null references public.seo_admins(email) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.search_console_oauth_states enable row level security;
revoke all on table public.search_console_oauth_states from anon, authenticated;
create policy "service role manages search console oauth states"
  on public.search_console_oauth_states for all to service_role
  using (true) with check (true);
