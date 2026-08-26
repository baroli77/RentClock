create table if not exists public.seo_search_metrics (
  owner_email text not null references public.seo_admins(email) on update cascade on delete cascade,
  query text not null,
  page text not null,
  clicks integer not null default 0 check (clicks >= 0),
  impressions integer not null default 0 check (impressions >= 0),
  ctr double precision not null default 0 check (ctr >= 0 and ctr <= 1),
  position double precision not null default 0 check (position >= 0),
  period_start date not null,
  period_end date not null,
  updated_at timestamptz not null default now(),
  primary key (owner_email, query, page)
);
create index if not exists seo_search_metrics_owner_impressions_idx on public.seo_search_metrics (owner_email, impressions desc);
alter table public.seo_search_metrics enable row level security;
revoke all on table public.seo_search_metrics from anon, authenticated;
grant all on table public.seo_search_metrics to service_role;
comment on table public.seo_search_metrics is 'Service-only Search Console query/page snapshots used by the owner SEO workspace.';
