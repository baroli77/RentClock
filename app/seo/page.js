import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import SeoWorkspace from "@/components/SeoWorkspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO workspace" };

export default async function SeoPage() {
  const supabase = await createClient();
  try {
    const { admin } = await requireSeoAdmin(supabase);
    const { data: opportunities } = await admin
      .from("seo_opportunities")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    return <SeoWorkspace initialOpportunities={opportunities || []} />;
  } catch {
    redirect("/dashboard");
  }
}
