create policy "seo metrics are service-only"
  on public.seo_search_metrics
  for all
  to anon, authenticated
  using (false)
  with check (false);
