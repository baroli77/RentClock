import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import SeoWorkspace from "@/components/SeoWorkspace";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "SEO workspace",
  alternates: { canonical: "/seo" },
  robots: { index: false, follow: false },
};

export default async function SeoPage() {
  const supabase = await createClient();
  let context;
  try {
    context = await requireSeoAdmin(supabase);
  } catch {
    redirect("/dashboard");
  }
  const { user, admin } = context;
  const { data: opportunities, error: opportunitiesError } = await admin
    .from("seo_opportunities")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (opportunitiesError) throw new Error(`Could not load SEO opportunities: ${opportunitiesError.message}`);

  const { data: searchConsole, error: searchConsoleError } = await admin
    .from("search_console_connections")
    .select("selected_property, properties, connected_at, last_imported_at")
    .eq("owner_email", user.email.toLowerCase())
    .maybeSingle();
  if (searchConsoleError) throw new Error(`Could not load Search Console connection: ${searchConsoleError.message}`);

  const { data: indexStatuses, error: indexStatusError } = await admin
    .from("seo_index_status")
    .select("url, verdict, coverage_state, robots_txt_state, indexing_state, page_fetch_state, last_crawl_time, inspected_at, inspection_error")
    .eq("owner_email", user.email.toLowerCase())
    .order("url");
  if (indexStatusError) throw new Error(`Could not load Google index status: ${indexStatusError.message}`);

  return <SeoWorkspace initialOpportunities={opportunities || []} searchConsole={searchConsole} initialIndexStatuses={indexStatuses || []} />;
}
