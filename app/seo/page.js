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
  try {
    const { user, admin } = await requireSeoAdmin(supabase);
    const { data: opportunities } = await admin
      .from("seo_opportunities")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    const { data: searchConsole } = await admin
      .from("search_console_connections")
      .select("selected_property, properties, connected_at, last_imported_at")
      .eq("owner_email", user.email.toLowerCase())
      .maybeSingle();

    return <SeoWorkspace initialOpportunities={opportunities || []} searchConsole={searchConsole} />;
  } catch {
    redirect("/dashboard");
  }
}
