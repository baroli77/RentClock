create table if not exists public.growth_config (
  id integer primary key default 1 check (id = 1),
  mode text not null default 'dry_run' check (mode in ('dry_run','approval','autonomous')),
  stop_requested boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.growth_config (id, mode, stop_requested)
values (1, 'dry_run', false)
on conflict (id) do nothing;

create table if not exists public.growth_daily_metrics (
  id bigint generated always as identity primary key,
  metric_date date not null,
  channel text not null,
  campaign_key text not null default '',
  spend_pence integer not null default 0 check (spend_pence >= 0),
  clicks integer not null default 0 check (clicks >= 0),
  trials integer not null default 0 check (trials >= 0),
  paid_customers integer not null default 0 check (paid_customers >= 0),
  revenue_pence integer not null default 0 check (revenue_pence >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(metric_date, channel, campaign_key)
);

create table if not exists public.growth_experiments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  hypothesis text,
  channel text not null,
  status text not null default 'proposed' check (status in ('proposed','approved','running','paused','completed','rejected')),
  max_spend_pence integer not null default 0 check (max_spend_pence between 0 and 10000),
  result_summary text,
  learning text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_runs (
  id uuid primary key default gen_random_uuid(),
  mode text not null,
  summary text,
  state jsonb not null default '{}'::jsonb,
  raw_plan jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.growth_actions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.growth_runs(id) on delete cascade,
  action_type text not null,
  channel text,
  target text,
  reason text,
  budget_pence integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (status in ('proposed','approval_required','blocked','approved','executed','failed','cancelled')),
  validation_reason text,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

alter table public.growth_config enable row level security;
alter table public.growth_daily_metrics enable row level security;
alter table public.growth_experiments enable row level security;
alter table public.growth_runs enable row level security;
alter table public.growth_actions enable row level security;

-- No public RLS policies by design. The internal growth workspace uses the server-only service-role client after admin authentication.
