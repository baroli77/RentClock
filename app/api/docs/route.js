import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasAccess } from "@/lib/billing";

const MAX_DOC_BYTES = 5 * 1024 * 1024;
const BUCKET = "certs";
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

async function canEdit(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();
  return !error && hasAccess(profile);
}

// POST multipart form: file -> stores at {userId}/{random}-{filename}
export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await canEdit(supabase, user.id))) {
    return NextResponse.json({ error: "An active subscription or trial is required to upload documents" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_DOC_BYTES) {
    return NextResponse.json({ error: "File too large (5 MB max)" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only PDF, JPEG, PNG and WebP files are allowed" }, { status: 400 });
  }

  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 100);
  const path = `${user.id}/${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}-${safeName}`;

  const bytes = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path, name: file.name, size: file.size });
}

// GET ?path= -> short-lived signed download URL
export async function GET(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!(await canEdit(supabase, user.id))) {
    return NextResponse.json({ error: "An active subscription or trial is required to delete documents" }, { status: 403 });
  }

  const path = new URL(request.url).searchParams.get("path");
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl });
}

// DELETE ?path=
export async function DELETE(request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const path = new URL(request.url).searchParams.get("path");
  if (!path || !path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
