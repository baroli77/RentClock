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

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const { data: rows } = await supabase
    .from("properties")
    .select("id, payload")
    .order("updated_at", { ascending: true });

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
