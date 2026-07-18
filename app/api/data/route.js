import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/billing";

async function canEdit(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();
  return !error && hasAccess(profile);
}

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function signedInEditor() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { response: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  if (!(await canEdit(supabase, user.id))) {
    return {
      response: NextResponse.json(
        { error: "An active subscription or trial is required to edit your ledger" },
        { status: 403 }
      ),
    };
  }
  return { supabase, user };
}

// POST: save exactly one property. Single-row writes avoid stale browser tabs
// deleting or overwriting unrelated properties during autosave.
export async function POST(request) {
  const auth = await signedInEditor();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const property = body?.property;
  if (!property || typeof property !== "object" || Array.isArray(property)) {
    return NextResponse.json({ error: "property object required" }, { status: 400 });
  }
  const { id, ...payload } = property;
  if (!String(payload.name || payload.address || "").trim()) {
    return NextResponse.json({ error: "Property name or address required" }, { status: 400 });
  }
  if (JSON.stringify(payload).length > 250000) {
    return NextResponse.json({ error: "Property record is too large" }, { status: 413 });
  }

  const row = { user_id: user.id, payload, updated_at: new Date().toISOString() };
  let saved;
  let error;
  if (typeof id === "string" && UUID_RE.test(id)) {
    ({ data: saved, error } = await supabase
      .from("properties")
      .update(row)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, payload")
      .maybeSingle());
    if (!error && !saved) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
  } else {
    ({ data: saved, error } = await supabase
      .from("properties")
      .insert(row)
      .select("id, payload")
      .single());
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ property: { ...saved.payload, id: saved.id } });
}

export async function DELETE(request) {
  const auth = await signedInEditor();
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!UUID_RE.test(String(body?.id || ""))) {
    return NextResponse.json({ error: "Valid property id required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", body.id)
    .eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
