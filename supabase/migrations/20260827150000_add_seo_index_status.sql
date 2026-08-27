create table if not exists public.seo_index_status (
  owner_email text not null,
  url text not null,
  verdict text not null default 'VERDICT_UNSPECIFIED',
  coverage_state text,
  robots_txt_state text,
  indexing_state text,
  page_fetch_state text,
  last_crawl_time timestamptz,
  google_canonical text,
  user_canonical text,
  referring_urls jsonb not null default '[]'::jsonb,
  sitemaps jsonb not null default '[]'::jsonb,
  inspected_at timestamptz not null default now(),
  inspection_error text,
  primary key (owner_email, url)
);

alter table public.seo_index_status enable row level security;
revoke all on table public.seo_index_status from anon, authenticated;
grant select, insert, update, delete on table public.seo_index_status to service_role;
