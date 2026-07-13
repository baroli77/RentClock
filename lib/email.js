// ---------------------------------------------------------------------------
// Email templates. A single inline-CSS wrapper (email clients are stuck in
// 2003 — no <style> blocks, no external CSS, tables for layout in the worst
// cases) plus text fallbacks. Keep everything inline and boring.
// ---------------------------------------------------------------------------

const INK = "#1c2430";
const PAPER = "#f4f5f2";
const BRASS = "#9a7b2d";
const RED = "#b3261e";
const AMBER = "#8a5b00";
const GREY = "#6b7280";
const LINE = "#dcdfd8";

function shell(innerHtml, site) {
  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
    <div style="border-bottom:2px solid ${INK};padding-bottom:14px;margin-bottom:20px;">
      <span style="font-size:22px;font-weight:800;letter-spacing:-0.02em;">
        <span style="color:${BRASS};">&#9151;</span> RentClock
      </span>
    </div>
    ${innerHtml}
    <div style="margin-top:28px;padding-top:16px;border-top:1px solid ${LINE};font-size:12px;color:${GREY};line-height:1.5;">
      <a href="${site}/dashboard" style="color:${INK};font-weight:600;">Open your ledger</a>
      &nbsp;&middot;&nbsp; This is an automated compliance reminder, not legal advice.
    </div>
  </div>
</body>
</html>`;
}

function rowHtml(line) {
  const color = line.tone === "overdue" ? RED : line.tone === "soon" ? AMBER : GREY;
  return `<tr>
    <td style="padding:10px 0;border-top:1px solid ${LINE};vertical-align:top;">
      <div style="font-weight:600;font-size:14px;">${escapeHtml(line.item)}</div>
      <div style="font-size:12.5px;color:${GREY};">${escapeHtml(line.property)}</div>
    </td>
    <td style="padding:10px 0;border-top:1px solid ${LINE};text-align:right;vertical-align:top;white-space:nowrap;">
      <span style="font-size:12px;font-weight:700;color:${color};">${escapeHtml(line.status)}</span>
    </td>
  </tr>`;
}

function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// lines: [{ item, property, status, tone }]
export function reminderEmail({ lines, site }) {
  const intro =
    lines.length === 1
      ? "A compliance deadline needs your attention:"
      : `${lines.length} compliance deadlines need your attention:`;
  const html = shell(
    `<p style="font-size:15px;margin:0 0 16px;">${intro}</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
       ${lines.map(rowHtml).join("")}
     </table>`,
    site
  );
  const text = `RentClock\n\n${intro}\n\n${lines
    .map((l) => `- ${l.item} (${l.property}) ${l.status}`)
    .join("\n")}\n\nOpen your ledger: ${site}/dashboard\n\nThis is an automated compliance reminder, not legal advice.`;
  return { html, text };
}

// items: [{ item, property }]  (things with no date recorded yet)
export function missingEmail({ items, site }) {
  const intro =
    items.length === 1
      ? "One certificate has no date recorded, so RentClock can&rsquo;t warn you before it lapses:"
      : `${items.length} certificates have no date recorded, so RentClock can&rsquo;t warn you before they lapse:`;
  const html = shell(
    `<p style="font-size:15px;margin:0 0 16px;">${intro}</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
       ${items
         .map(
           (l) => `<tr>
             <td style="padding:10px 0;border-top:1px solid ${LINE};vertical-align:top;">
               <div style="font-weight:600;font-size:14px;">${escapeHtml(l.item)}</div>
               <div style="font-size:12.5px;color:${GREY};">${escapeHtml(l.property)}</div>
             </td>
             <td style="padding:10px 0;border-top:1px solid ${LINE};text-align:right;vertical-align:top;white-space:nowrap;">
               <span style="font-size:12px;font-weight:700;color:${GREY};">NOT RECORDED</span>
             </td>
           </tr>`
         )
         .join("")}
     </table>
     <p style="font-size:13px;color:${GREY};margin:16px 0 0;">Add the last completion date for each and RentClock will start counting down to the renewal.</p>`,
    site
  );
  const textIntro = intro.replace(/&rsquo;/g, "'");
  const text = `RentClock\n\n${textIntro}\n\n${items
    .map((l) => `- ${l.item} (${l.property})`)
    .join(
      "\n"
    )}\n\nAdd the last completion date for each and RentClock will start counting down.\n\nOpen your ledger: ${site}/dashboard\n\nThis is an automated reminder, not legal advice.`;
  return { html, text };
}


// Owner notification sent when a new member completes checkout and starts a trial.
export function newMemberEmail({ memberEmail, plan, site }) {
  const html = shell(
    `<p style="font-size:15px;margin:0 0 16px;">A new RentClock member has completed checkout and started a trial.</p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
       <tr><td style="padding:10px 0;border-top:1px solid ${LINE};font-size:13px;color:${GREY};">Member</td><td style="padding:10px 0;border-top:1px solid ${LINE};font-size:14px;font-weight:600;text-align:right;">${escapeHtml(memberEmail)}</td></tr>
       <tr><td style="padding:10px 0;border-top:1px solid ${LINE};font-size:13px;color:${GREY};">Plan selected</td><td style="padding:10px 0;border-top:1px solid ${LINE};font-size:14px;font-weight:600;text-align:right;">${escapeHtml(plan)}</td></tr>
     </table>`,
    site
  );
  const text = `RentClock\n\nA new member has completed checkout and started a trial.\n\nMember: ${memberEmail}\nPlan selected: ${plan}\n\nOpen RentClock: ${site}/dashboard`;
  return { html, text };
}
