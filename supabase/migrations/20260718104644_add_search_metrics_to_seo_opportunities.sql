alter table public.seo_opportunities
  add column if not exists search_metrics jsonb;

