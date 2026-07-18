import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasAccess, billingEnabled } from "@/lib/billing";
import RentClockDashboard from "@/components/RentClockDashboard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, propertiesResult] = await Promise.all([
    supabase.from("profiles").select("subscription_status").eq("id", user.id).single(),
    supabase.from("properties").select("id, payload").order("updated_at", { ascending: true }),
  ]);
  if (profileResult.error) {
    console.error("Dashboard profile query failed:", profileResult.error.message);
    throw new Error("RentClock could not load your account. Please try again.");
  }
  if (propertiesResult.error) {
    console.error("Dashboard property query failed:", propertiesResult.error.message);
    throw new Error("RentClock could not load your property ledger. Please try again.");
  }
  const profile = profileResult.data;
  const rows = propertiesResult.data;

  const properties = (rows || []).map((row) => ({ ...row.payload, id: row.id }));
  const access = hasAccess(profile);

  return (
    <RentClockDashboard
      initialProperties={properties}
      email={user.email}
      access={access}
      billingOn={billingEnabled()}
    />
  );
}
