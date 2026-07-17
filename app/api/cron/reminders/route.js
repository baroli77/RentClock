import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { datedItems, missingItems, fmt, toISO, today } from "@/lib/compliance";
import { hasAccess } from "@/lib/billing";
import { reminderEmail, missingEmail } from "@/lib/email";

// Daily cron (see vercel.json). Sends dated-deadline reminders every day and,
// on Mondays, a nag for certificates that have no date recorded at all.
// Once an item is overdue it remains in the daily email until the user records
// its renewal date. Compliance is not a one-and-done problem, unfortunately.
const THRESHOLDS = [60, 30, 14, 7, 0];

// A stable stamp for the weekly nag dedup, so each run day is one row.
// Uses the London calendar date, same as all deadline maths.
function weekStamp() {
  return toISO(today());
}

export async function GET(request) {
  // Vercel Cron sends Authorization: Bearer {CRON_SECRET}
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not set" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const admin = createAdminClient();
  const isMonday = today().getDay() === 1; // Monday in the UK, not in UTC

  const { data: profiles, error: pErr } = await admin
    .from("profiles")
    .select("id, email, subscription_status");
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  let sent = 0;
  let nags = 0;
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://rentclock.com";
  const from = "RentClock <support@rentclock.com>";

  for (const profile of profiles || []) {
    if (!profile.email || !hasAccess(profile)) continue;

    const { data: rows } = await admin
      .from("properties")
      .select("id, payload")
      .eq("user_id", profile.id);

    // ---------- 1. Dated deadline reminders (daily) ----------
    const lines = [];
    const logRows = [];

    for (const row of rows || []) {
      const prop = { ...row.payload, id: row.id };
      for (const { item, st } of datedItems(prop)) {
        // Bucketed catch-up: fire the most urgent crossed threshold not yet
        // logged. <= matching self-heals a missed cron run. Overdue items are
        // deliberately treated differently: they get a fresh log stamp each
        // day so the reminder keeps arriving until the date is updated.
        let threshold = null;
        if (st.days < 0) {
          threshold = -1; // overdue - one email per day until renewed
        } else {
          const crossed = THRESHOLDS.filter((t) => st.days <= t);
          if (crossed.length) threshold = Math.min(...crossed);
        }
        if (threshold === null) continue;
        const dueISO = toISO(st.due);
        // For normal reminder thresholds, dedupe against the actual deadline.
        // For an overdue reminder, dedupe against today's London date instead.
        // That produces at most one email per item per day, and preserves the
        // existing reminder log schema/unique index.
        const reminderStamp = threshold === -1 ? toISO(today()) : dueISO;

        const { data: existing } = await admin
          .from("reminders_sent")
          .select("id")
          .eq("user_id", profile.id)
          .eq("property_id", row.id)
          .eq("item_key", item.key)
          .eq("threshold", threshold)
          .eq("due_date", reminderStamp)
          .maybeSingle();
        if (existing) continue;

        const status =
          st.days < 0
            ? `OVERDUE by ${Math.abs(st.days)} ${Math.abs(st.days) === 1 ? "day" : "days"}`
            : st.days === 0
            ? "DUE TODAY"
            : `Due in ${st.days} days (${fmt(st.due)})`;
        const tone = st.days < 0 ? "overdue" : "soon";
        lines.push({ item: item.label, property: prop.name || "Your property", status, tone });

        const bucketsToLog = threshold === -1 ? [-1] : THRESHOLDS.filter((t) => st.days <= t);
        for (const b of bucketsToLog) {
          logRows.push({
            user_id: profile.id,
            property_id: row.id,
            item_key: item.key,
            threshold: b,
            due_date: b === -1 ? reminderStamp : dueISO,
          });
        }
      }
    }

    if (lines.length) {
      try {
        const { html, text } = reminderEmail({ lines, site });
        const { error: reminderError } = await resend.emails.send({
          from,
          to: profile.email,
          subject:
            lines.length === 1
              ? "RentClock: a compliance deadline needs your attention"
              : `RentClock: ${lines.length} compliance deadlines need your attention`,
          html,
          text,
        });
        if (reminderError) {
          throw new Error(`Resend rejected reminder: ${reminderError.message || JSON.stringify(reminderError)}`);
        }
        if (logRows.length)
          await admin.from("reminders_sent").upsert(logRows, {
            onConflict: "user_id,property_id,item_key,threshold,due_date",
            ignoreDuplicates: true,
          });
        sent += 1;
      } catch (e) {
        console.error(`Reminder failed for ${profile.email}:`, e.message);
      }
    }

    // ---------- 2. Weekly "not recorded" nag (Mondays only) ----------
    if (isMonday) {
      const missing = [];
      const missingLog = [];
      const stamp = weekStamp();
      for (const row of rows || []) {
        const prop = { ...row.payload, id: row.id };
        for (const { item } of missingItems(prop)) {
          const { data: existing } = await admin
            .from("reminders_sent")
            .select("id")
            .eq("user_id", profile.id)
            .eq("property_id", row.id)
            .eq("item_key", item.key)
            .eq("threshold", -2) // -2 reserved for the missing-date nag
            .eq("due_date", stamp)
            .maybeSingle();
          if (existing) continue;
          missing.push({ item: item.label, property: prop.name || "Your property" });
          missingLog.push({
            user_id: profile.id,
            property_id: row.id,
            item_key: item.key,
            threshold: -2,
            due_date: stamp,
          });
        }
      }

      if (missing.length) {
        try {
          const { html, text } = missingEmail({ items: missing, site });
          const { error: nagError } = await resend.emails.send({
            from,
            to: profile.email,
            subject:
              missing.length === 1
                ? "RentClock: a certificate has no date recorded"
                : `RentClock: ${missing.length} certificates have no date recorded`,
            html,
            text,
          });
          if (nagError) {
            throw new Error(`Resend rejected missing-date nag: ${nagError.message || JSON.stringify(nagError)}`);
          }
          await admin.from("reminders_sent").upsert(missingLog, {
            onConflict: "user_id,property_id,item_key,threshold,due_date",
            ignoreDuplicates: true,
          });
          nags += 1;
        } catch (e) {
          console.error(`Nag failed for ${profile.email}:`, e.message);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, emailsSent: sent, nagsSent: nags });
}
