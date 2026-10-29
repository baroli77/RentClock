-- Additive product workflow tables. Customer reads are owner-scoped;
-- delivery ingestion, milestone writes and atomic imports are server-only.
alter table public.profiles add column if not exists registration_renewal_due date;

create table public.email_deliveries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 provider_email_id text unique,
 kind text not null check (kind in ('deadline','missing')),
 subject text not null,
 item_count integer not null default 0 check (item_count >= 0),
 status text not null default 'queued' check (status in ('queued','sent','delayed','delivered','failed','bounced','suppressed','complained')),
 requested_at timestamptz not null default now(),
 status_at timestamptz not null default now()
);
create index email_deliveries_owner_time_idx on public.email_deliveries(user_id, requested_at desc);
alter table public.email_deliveries enable row level security;
create policy "owners read delivery status" on public.email_deliveries for select to authenticated using ((select auth.uid()) = user_id);
create policy "service manages delivery status" on public.email_deliveries for all to service_role using (true) with check (true);
grant select on public.email_deliveries to authenticated;
grant all on public.email_deliveries to service_role;
revoke all on public.email_deliveries from anon;

create table public.email_delivery_events (
 event_id text primary key,
 provider_email_id text not null,
 status text not null check (status in ('sent','delayed','delivered','failed','bounced','suppressed','complained')),
 occurred_at timestamptz not null,
 received_at timestamptz not null default now()
);
create index email_delivery_events_provider_idx on public.email_delivery_events(provider_email_id, occurred_at desc);
alter table public.email_delivery_events enable row level security;
create policy "service manages delivery events" on public.email_delivery_events for all to service_role using (true) with check (true);
revoke all on public.email_delivery_events from anon, authenticated;
grant all on public.email_delivery_events to service_role;

create function public.refresh_email_delivery(p_email_id text) returns void
language sql security invoker set search_path = '' as $$
 update public.email_deliveries d set status = e.status, status_at = e.occurred_at
 from (select status, occurred_at from public.email_delivery_events where provider_email_id = p_email_id
 order by case status when 'complained' then 7 when 'bounced' then 6 when 'suppressed' then 5 when 'failed' then 4 when 'delivered' then 3 when 'delayed' then 2 else 1 end desc, occurred_at desc limit 1) e
 where d.provider_email_id = p_email_id;
$$;
revoke all on function public.refresh_email_delivery(text) from public, anon, authenticated;
grant execute on function public.refresh_email_delivery(text) to service_role;

create function public.record_email_delivery_event(p_event_id text,p_email_id text,p_status text,p_occurred_at timestamptz) returns void
language plpgsql security invoker set search_path = '' as $$
begin
 insert into public.email_delivery_events(event_id,provider_email_id,status,occurred_at) values(p_event_id,p_email_id,p_status,p_occurred_at) on conflict(event_id) do nothing;
 perform public.refresh_email_delivery(p_email_id);
end;
$$;
revoke all on function public.record_email_delivery_event(text,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.record_email_delivery_event(text,text,text,timestamptz) to service_role;

create table public.product_milestones (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_name text not null check(event_name in ('first_property_saved','first_certificate_uploaded','setup_completed')),
 occurred_at timestamptz not null default now(),
 forwarded_at timestamptz,
 unique(user_id,event_name)
);
alter table public.product_milestones enable row level security;
create policy "owners read own milestones" on public.product_milestones for select to authenticated using ((select auth.uid()) = user_id);
create policy "service manages milestones" on public.product_milestones for all to service_role using (true) with check (true);
grant select on public.product_milestones to authenticated;
grant all on public.product_milestones to service_role;
revoke all on public.product_milestones from anon;
create index product_milestones_pending_idx on public.product_milestones(occurred_at) where forwarded_at is null;

create table public.property_imports (
 id uuid primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 digest text not null,
 property_ids uuid[] not null,
 skipped integer not null default 0,
 created_at timestamptz not null default now()
);
create index property_imports_owner_idx on public.property_imports(user_id);
alter table public.property_imports enable row level security;
create policy "service manages imports" on public.property_imports for all to service_role using (true) with check (true);
revoke all on public.property_imports from anon, authenticated;
grant all on public.property_imports to service_role;

create function public.import_property_records(p_user_id uuid,p_batch_id uuid,p_digest text,p_properties jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare previous public.property_imports; item jsonb; inserted_id uuid; ids uuid[] := '{}'; skipped_count integer := 0; result_rows jsonb;
begin
 if jsonb_typeof(p_properties) <> 'array' or jsonb_array_length(p_properties) > 250 then raise exception 'Invalid import size'; end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));
 select * into previous from public.property_imports where id=p_batch_id;
 if found then
  if previous.user_id <> p_user_id or previous.digest <> p_digest then raise exception 'Import batch does not match request'; end if;
  ids := previous.property_ids; skipped_count := previous.skipped;
 else
  for item in select value from jsonb_array_elements(p_properties) loop
   if jsonb_typeof(item) <> 'object' or length(btrim(coalesce(item->>'address',''))) = 0 then raise exception 'Address is required'; end if;
   if exists (select 1 from public.properties where user_id=p_user_id and lower(btrim(payload->>'address'))=lower(btrim(item->>'address'))) then
    skipped_count := skipped_count + 1;
   else
    insert into public.properties(user_id,payload) values(p_user_id,item - 'id') returning id into inserted_id;
    ids := array_append(ids,inserted_id);
   end if;
  end loop;
  insert into public.property_imports(id,user_id,digest,property_ids,skipped) values(p_batch_id,p_user_id,p_digest,ids,skipped_count);
 end if;
 select coalesce(jsonb_agg(payload || jsonb_build_object('id',id)), '[]'::jsonb) into result_rows from public.properties where user_id=p_user_id and id=any(ids);
 return jsonb_build_object('properties',result_rows,'skipped',skipped_count);
end;
$$;
revoke all on function public.import_property_records(uuid,uuid,text,jsonb) from public, anon, authenticated;
grant execute on function public.import_property_records(uuid,uuid,text,jsonb) to service_role;

-- The cohort starts when this migration is installed, not at an invented date.
create table public.product_measurement_settings (
 singleton boolean primary key default true check(singleton),
 enabled_at timestamptz not null default now()
);
alter table public.product_measurement_settings enable row level security;
create policy "service manages measurement settings" on public.product_measurement_settings for all to service_role using(true) with check(true);
revoke all on public.product_measurement_settings from anon, authenticated;
grant all on public.product_measurement_settings to service_role;
insert into public.product_measurement_settings(singleton) values(true);
create function public.product_activation_metrics() returns jsonb
language sql stable security invoker set search_path='' as $$
 with cohort as (
 select p.id,p.subscription_status from public.profiles p
 where p.created_at >= (select enabled_at from public.product_measurement_settings where singleton)
 )
 select jsonb_build_object(
 'tracking_since',(select enabled_at from public.product_measurement_settings where singleton),
 'accounts',(select count(*) from cohort),
 'trials',(select count(*) from cohort where subscription_status='trialing'),
 'paid',(select count(*) from cohort where subscription_status='active'),
 'property',(select count(*) from public.product_milestones m join cohort c on c.id=m.user_id where event_name='first_property_saved'),
 'certificate',(select count(*) from public.product_milestones m join cohort c on c.id=m.user_id where event_name='first_certificate_uploaded'),
 'setup',(select count(*) from public.product_milestones m join cohort c on c.id=m.user_id where event_name='setup_completed')
 );
$$;
revoke all on function public.product_activation_metrics() from public,anon,authenticated;
grant execute on function public.product_activation_metrics() to service_role;
