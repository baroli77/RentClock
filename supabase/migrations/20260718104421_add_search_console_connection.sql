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
  on public.search_console_connections for all to service_role using (true) with check (true);

create table if not exists public.search_console_oauth_states (
  state text primary key,
  owner_email text not null references public.seo_admins(email) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists search_console_oauth_states_owner_email_idx
  on public.search_console_oauth_states (owner_email);
alter table public.search_console_oauth_states enable row level security;
revoke all on table public.search_console_oauth_states from anon, authenticated;
create policy "service role manages search console oauth states"
  on public.search_console_oauth_states for all to service_role using (true) with check (true);

