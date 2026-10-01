// Service-role client. SERVER ONLY - bypasses RLS. Used by webhooks and cron.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithClockSkewRetry(input, init) {
  let response = await fetch(input, init);
  // PostgREST can briefly reject a freshly-issued service key if the two
  // platform clocks differ by a second or two. Retrying this one error is safe
  // and avoids losing an entire cron run to a transient timing race.
  for (const wait of [1200, 2500]) {
    const body = await response.clone().text();
    if (!body.includes("PGRST303") || !/JWT issued at future/i.test(body)) return response;
    await delay(wait);
    response = await fetch(input, init);
  }
  return response;
}

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
      global: { fetch: fetchWithClockSkewRetry },
    }
  );
}
