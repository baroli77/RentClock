create policy "service role manages seo admins" on public.seo_admins for all to service_role
  using (true) with check (true);
create policy "service role manages seo opportunities" on public.seo_opportunities for all to service_role
  using (true) with check (true);

