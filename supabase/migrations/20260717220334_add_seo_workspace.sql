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
  published_draft jsonb,
  first_published_at timestamptz,
  published_at timestamptz,
  search_metrics jsonb,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists seo_opportunities_status_priority_idx
  on public.seo_opportunities (status, priority desc, created_at desc);
alter table public.seo_opportunities enable row level security;
revoke all on table public.seo_opportunities from anon, authenticated;

