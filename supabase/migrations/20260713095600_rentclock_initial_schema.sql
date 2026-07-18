create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  stripe_customer_id text,
  subscription_status text not null default 'none',
  owner_notification_sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists properties_user_idx on public.properties (user_id);
alter table public.properties enable row level security;
create policy "select own properties" on public.properties for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own properties" on public.properties for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "update own properties" on public.properties for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete own properties" on public.properties for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.reminders_sent (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  property_id uuid not null,
  item_key text not null,
  threshold int not null,
  due_date date not null,
  sent_at timestamptz not null default now(),
  unique (user_id, property_id, item_key, threshold, due_date)
);
alter table public.reminders_sent enable row level security;
create policy "service role writes reminders" on public.reminders_sent for all to service_role
  using (true) with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('certs', 'certs', false, 5242880, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
create policy "certs read own" on storage.objects for select to authenticated
  using (bucket_id = 'certs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "certs insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'certs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "certs delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'certs' and (storage.foldername(name))[1] = (select auth.uid())::text);

