-- Applied to production as Supabase migration 20260713152058.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "select own properties" on public.properties;
drop policy if exists "insert own properties" on public.properties;
drop policy if exists "update own properties" on public.properties;
drop policy if exists "delete own properties" on public.properties;
create policy "select own properties" on public.properties for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own properties" on public.properties for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "update own properties" on public.properties for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "delete own properties" on public.properties for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "service role writes reminders" on public.reminders_sent for all to service_role
  using (true) with check (true);

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'certs';

drop policy if exists "certs read own" on storage.objects;
drop policy if exists "certs insert own" on storage.objects;
drop policy if exists "certs delete own" on storage.objects;
create policy "certs read own" on storage.objects for select to authenticated
  using (bucket_id = 'certs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "certs insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'certs' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "certs delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'certs' and (storage.foldername(name))[1] = (select auth.uid())::text);
