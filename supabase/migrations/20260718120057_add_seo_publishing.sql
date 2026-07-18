alter table public.seo_opportunities
  add column if not exists published_at timestamptz,
  add column if not exists published_draft jsonb,
  add column if not exists first_published_at timestamptz;

