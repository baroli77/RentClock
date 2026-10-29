-- Keep synthetic QA fixtures outside activation figures and outbound analytics.
-- These fixed-query functions are service-only; authenticated clients cannot call them.
create or replace function public.product_activation_metrics() returns jsonb
language sql stable security definer set search_path='' as $$
 with cohort as (
 select p.id,p.subscription_status from public.profiles p join auth.users u on u.id=p.id
 where coalesce(u.raw_app_meta_data->>'rentclock_qa_fixture','')<>'true' and p.created_at >= (select enabled_at from public.product_measurement_settings where singleton)
 )
 select jsonb_build_object(
 'tracking_since',(select enabled_at from public.product_measurement_settings where singleton),
 'accounts',(select count(*) from cohort),
 'trials',(select count(*) from cohort where subscription_status='trialing'),
 'paid',(select count(*) from cohort where subscription_status='active'),
 'property',(select count(*) from public.product_milestones m join cohort c on c.id=m.user_id where event_name='first_property_saved'),
 'certificate',(select count(*) from public.product_milestones m join cohort c on c.id=m.user_id where event_name='first_certificate_uploaded'),
 'pending_milestones',(select count(*) from public.product_milestones m join auth.users u on u.id=m.user_id where m.forwarded_at is null and coalesce(u.raw_app_meta_data->>'rentclock_qa_fixture','')<>'true'),
 'last_forwarded_at',(select max(m.forwarded_at) from public.product_milestones m join auth.users u on u.id=m.user_id where coalesce(u.raw_app_meta_data->>'rentclock_qa_fixture','')<>'true'),
 'setup',(select count(*) from public.product_milestones m join cohort c on c.id=m.user_id where event_name='setup_completed')
 );
$$;
revoke all on function public.product_activation_metrics() from public,anon,authenticated;
grant execute on function public.product_activation_metrics() to service_role;

create function public.pending_product_milestones() returns setof public.product_milestones
language sql stable security definer set search_path='' as $$
 select m.* from public.product_milestones m join auth.users u on u.id=m.user_id
 where m.forwarded_at is null and coalesce(u.raw_app_meta_data->>'rentclock_qa_fixture','')<>'true'
 order by m.occurred_at limit 25;
$$;
revoke all on function public.pending_product_milestones() from public,anon,authenticated;
grant execute on function public.pending_product_milestones() to service_role;
