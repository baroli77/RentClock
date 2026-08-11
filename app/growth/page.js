import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSeoAdmin } from "@/lib/seo";
import GrowthAutopilot from "@/components/GrowthAutopilot";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Growth Autopilot | RentClock",
  robots: { index: false, follow: false },
};

export default async function GrowthPage() {
  const supabase = await createClient();
  try {
    await requireSeoAdmin(supabase);
  } catch {
    redirect("/dashboard");
  }
  return <GrowthAutopilot />;
}
