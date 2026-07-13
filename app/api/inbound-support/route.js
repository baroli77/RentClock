import { Resend } from "resend";

export const runtime = "nodejs";

const SUPPORT_ADDRESS = "support@rentclock.com";
const FORWARD_TO = "obarton77@gmail.com";

function plainTextFallback(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br />");
}

export async function POST(request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;

  if (!webhookSecret || !apiKey) {
    return Response.json({ error: "Inbound support email is not configured." }, { status: 503 });
  }

  const payload = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return Response.json({ error: "Missing webhook signature." }, { status: 400 });
  }

  const resend = new Resend(apiKey);
  let event;

  try {
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return Response.json({ received: true, ignored: true });
  }

  const recipients = Array.isArray(event.data.to) ? event.data.to : [event.data.to];
  const isSupportEmail = recipients.some(
    (recipient) => String(recipient || "").toLowerCase() === SUPPORT_ADDRESS
  );

  if (!isSupportEmail) {
    return Response.json({ received: true, ignored: true });
  }

  const { data: receivedEmail, error: emailError } = await resend.emails.receiving.get(
    event.data.email_id
  );

  if (emailError || !receivedEmail) {
    console.error("Could not retrieve received support email", emailError);
    return Response.json({ error: "Could not retrieve email." }, { status: 502 });
  }

  const { data: attachmentResponse, error: attachmentError } =
    await resend.emails.receiving.attachments.list({ emailId: event.data.email_id });

  if (attachmentError) {
    console.error("Could not retrieve support email attachments", attachmentError);
  }

  const attachments = await Promise.all(
    (attachmentResponse?.data || []).map(async (attachment) => {
      const response = await fetch(attachment.download_url);

      if (!response.ok) {
        throw new Error(`Could not download attachment ${attachment.filename}`);
      }

      return {
        filename: attachment.filename,
        content: Buffer.from(await response.arrayBuffer()).toString("base64"),
        contentType: attachment.content_type,
        ...(attachment.content_id ? { contentId: attachment.content_id } : {}),
      };
    })
  );

  const { error: forwardError } = await resend.emails.send({
    from: "RentClock Support <support@rentclock.com>",
    to: [FORWARD_TO],
    replyTo: receivedEmail.from,
    subject: `Fwd: ${receivedEmail.subject || "(no subject)"}`,
    html: receivedEmail.html || plainTextFallback(receivedEmail.text),
    text: receivedEmail.text || "See the forwarded email in an HTML-capable mail client.",
    attachments,
  });

  if (forwardError) {
    console.error("Could not forward support email", forwardError);
    return Response.json({ error: "Could not forward email." }, { status: 502 });
  }

  return Response.json({ received: true, forwarded: true });
}
