begin;
do $$
declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); batch uuid:=gen_random_uuid(); r jsonb; again jsonb; payload jsonb:='[{"name":"QA flat","address":"Fixture Road","dates":{}},{"name":"Duplicate","address":" fixture road ","dates":{}}]'; count_before bigint;
begin
 insert into auth.users(id,email) values(a,'qa-'||a||'@example.invalid'),(b,'qa-'||b||'@example.invalid');
 perform set_config('rentclock.qa_owner',a::text,true);
 perform set_config('rentclock.qa_other',b::text,true);
 r:=public.import_property_records(a,batch,'digest',payload);
 if jsonb_array_length(r->'properties')<>1 or (r->>'skipped')::int<>1 then raise exception 'Duplicate address check failed';end if;
 again:=public.import_property_records(a,batch,'digest',payload);
 if r<>again then raise exception 'Retry was not idempotent';end if;
 begin
  perform public.import_property_records(a,batch,'different',payload);
  raise exception 'FAIL: digest mismatch accepted';
 exception when others then if sqlerrm='FAIL: digest mismatch accepted' then raise;end if;end;
 select count(*) into count_before from public.properties where user_id=a;
 begin
  perform public.import_property_records(a,gen_random_uuid(),'bad','[{"address":"Partial row"},{"address":""}]');
  raise exception 'FAIL: invalid import accepted';
 exception when others then if sqlerrm='FAIL: invalid import accepted' then raise;end if;end;
 if (select count(*) from public.properties where user_id=a)<>count_before then raise exception 'Partial import survived failure';end if;
 insert into public.email_deliveries(user_id,provider_email_id,kind,subject)values(a,'qa-provider-owner','deadline','Fixture'),(b,'qa-provider-other','missing','Other fixture');
 perform public.record_email_delivery_event('qa-delivered','qa-provider-owner','delivered',now());
 perform public.record_email_delivery_event('qa-sent','qa-provider-owner','sent',now()-interval '1 minute');
 perform public.record_email_delivery_event('qa-delivered','qa-provider-owner','delivered',now());
 if (select status from public.email_deliveries where provider_email_id='qa-provider-owner')<>'delivered' then raise exception 'Out-of-order regression';end if;
 if (select count(*) from public.email_delivery_events where event_id='qa-delivered')<>1 then raise exception 'Duplicate event';end if;
 perform public.record_email_delivery_event('qa-bounced','qa-provider-owner','bounced',now());
 perform public.record_email_delivery_event('qa-delivered-late','qa-provider-owner','delivered',now());
 if (select status from public.email_deliveries where provider_email_id='qa-provider-owner')<>'bounced' then raise exception 'Bounce lost';end if;
 insert into public.product_milestones(user_id,event_name)values(a,'first_property_saved')on conflict(user_id,event_name)do nothing;
 insert into public.product_milestones(user_id,event_name)values(a,'first_property_saved')on conflict(user_id,event_name)do nothing;
 if (select count(*) from public.product_milestones where user_id=a)<>1 then raise exception 'Milestone duplicated';end if;
 if has_function_privilege('authenticated','public.import_property_records(uuid,uuid,text,jsonb)','execute') then raise exception 'Import RPC exposed';end if;
 if has_function_privilege('anon','public.record_email_delivery_event(text,text,text,timestamptz)','execute') then raise exception 'Webhook RPC exposed';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('rentclock.qa_owner'),true);
do $$ begin
 if (select count(*) from public.email_deliveries)<>1 then raise exception 'Delivery RLS failed';end if;
 if exists(select 1 from public.email_deliveries where user_id<>current_setting('rentclock.qa_owner')::uuid)then raise exception 'Cross-account delivery';end if;
 if (select count(*) from public.product_milestones)<>1 then raise exception 'Milestone RLS failed';end if;
 begin
  insert into public.product_milestones(user_id,event_name)values(current_setting('rentclock.qa_owner')::uuid,'setup_completed');
  raise exception 'FAIL: milestone forging allowed';
 exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'passed: atomic imports, duplicate retries, changed batches, delivery ordering, webhook replays, milestone dedupe, ownership policies and RPC access; fixtures rolled back' as verification;
