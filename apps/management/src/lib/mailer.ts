// Stub mailer for phase 1: no RESEND_API_KEY configured yet, so every send
// just logs to the server console. Because nothing actually reaches an
// inbox, callers (invite/reset flows) also surface the link directly in the
// staff UI so those flows are testable end-to-end today. Swap the body of
// this function for a real Resend call once RESEND_API_KEY is set — the
// call sites don't need to change.
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(message: MailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[mailer] (stub, no RESEND_API_KEY) to=${message.to} subject="${message.subject}"\n${message.html}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Web Quokka <noreply@quokkadisco.com>",
      to: message.to,
      subject: message.subject,
      html: message.html,
    }),
  });

  if (!res.ok) {
    console.error(`[mailer] Resend send failed (${res.status}):`, await res.text());
    return;
  }
  // Without this, a delivered email and one that was never attempted leave the
  // same (empty) trace in the logs.
  console.log(`[mailer] sent to=${message.to} subject="${message.subject}"`);
}
