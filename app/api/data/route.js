import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: all of the signed-in user's properties.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("properties")
    .select("id, payload")
    .order("updated_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const properties = (data || []).map((row) => ({ ...row.payload, id: row.id }));
  return NextResponse.json({ properties });
}

// POST: full sync of the user's property list (upsert changed, delete removed).
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const incoming = Array.isArray(body?.properties) ? body.properties : null;
  if (!incoming) return NextResponse.json({ error: "properties array required" }, { status: 400 });
  if (incoming.length > 100) {
    return NextResponse.json({ error: "Too many properties" }, { status: 400 });
  }

  const { data: existing, error: exErr } = await supabase.from("properties").select("id");
  if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 });

  const incomingIds = new Set();
  const rows = incoming.map((p) => {
    const { id, ...payload } = p;
    const isUuid = typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id);
    const row = {
      user_id: user.id,
      payload,
      updated_at: new Date().toISOString(),
    };
    if (isUuid) {
      row.id = id;
      incomingIds.add(id);
    }
    return row;
  });

  const { data: upserted, error: upErr } = await supabase
    .from("properties")
    .upsert(rows, { onConflict: "id" })
    .select("id");
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  for (const r of upserted || []) incomingIds.add(r.id);
  const toDelete = (existing || []).map((r) => r.id).filter((id) => !incomingIds.has(id));
  if (toDelete.length) {
    await supabase.from("properties").delete().in("id", toDelete);
  }

  // Return canonical list (with server-assigned ids for new rows)
  const { data: fresh } = await supabase
    .from("properties")
    .select("id, payload")
    .order("updated_at", { ascending: true });
  const properties = (fresh || []).map((row) => ({ ...row.payload, id: row.id }));
  return NextResponse.json({ properties });
}
