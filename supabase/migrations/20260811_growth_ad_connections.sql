create table if not exists public.growth_ad_connections (
  provider text primary key check (provider in ('google','microsoft')),
  refresh_token_encrypted text not null,
  account_id text,
  customer_id text,
  account_name text,
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.growth_oauth_states (
  state text primary key,
  provider text not null check (provider in ('google','microsoft')),
  owner_email text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.growth_ad_connections enable row level security;
alter table public.growth_oauth_states enable row level security;

-- No public RLS policies. Access is server-only after RentClock admin authentication.
