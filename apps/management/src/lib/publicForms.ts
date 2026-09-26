import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeEmail, escapeHtml } from "@/lib/validate";
import { isRateLimited } from "@/lib/rateLimit";
import { sendMail } from "@/lib/mailer";
import { adminUserIds, notifyMany } from "@/lib/notify";
import type { EnquiryType } from "@/types";

// Shared body of the marketing site's contact and quote forms. They differ
// only in `type` and which optional fields they carry, so one validator and
// one insert path serves both rather than two near-identical routes.

export interface EnquiryResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

const MAX = { name: 120, business: 160, phone: 40, service: 120, budget: 60, message: 5000 };

/** Trim, collapse whitespace, and cap length. Public input is untrusted and
 *  unbounded — a 10MB "name" must not reach the database. */
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, max);
}

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function handleEnquiry(
  req: NextRequest,
  type: EnquiryType,
  raw: Record<string, unknown>
): Promise<EnquiryResult> {
  // A hidden field real users never fill. Bots that fill every input get a
  // 200 with nothing written — failing loudly would just teach them to skip it.
  if (typeof raw.website === "string" && raw.website.trim() !== "") {
    return { ok: true, status: 201, body: { success: true } };
  }

  const ip = clientIp(req);
  if (isRateLimited(`public-enquiry:ip:${ip}`, 5, 10 * 60 * 1000)) {
    return {
      ok: false,
      status: 429,
      body: { error: "Too many submissions. Please try again in a few minutes." },
    };
  }

  const name = clean(raw.name, MAX.name);
  const email = normalizeEmail(raw.email);
  const message = clean(raw.message ?? raw.details, MAX.message);

  if (!name) return { ok: false, status: 400, body: { error: "Please enter your name." } };
  if (!email) return { ok: false, status: 400, body: { error: "Please enter a valid email address." } };
  // A quote request is a structured brief (service + budget carry the intent),
  // so unlike the contact form it does not require a written message.
  if (type === "Contact" && !message) {
    return { ok: false, status: 400, body: { error: "Please tell us a little about your project." } };
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      type,
      name,
      email,
      business: clean(raw.business ?? raw.company, MAX.business),
      phone: clean(raw.phone, MAX.phone),
      service: clean(raw.service ?? raw.projectType, MAX.service),
      budget: clean(raw.budget, MAX.budget),
      message,
      ipAddress: ip,
    },
  });

  const label = type === "Quote" ? "quote request" : "enquiry";

  // Fire-and-forget, exactly like every other notify/audit call in this app:
  // the visitor's form must not fail because staff alerting had a bad day.
  void notifyMany(await adminUserIds(), {
    type: "EnquiryReceived",
    title: `New ${label} from ${name}`,
    body: message || `${enquiry.service || "No service selected"} — ${email}`,
    link: "/enquiries",
  }).catch(() => {});

  // Only attempt mail when a recipient is actually configured — the in-app
  // bell above is the guaranteed channel, email is the optional extra.
  const notifyTo = process.env.ENQUIRY_NOTIFY_EMAIL?.trim();
  if (notifyTo) void sendMail({
    to: notifyTo,
    subject: `New WebQuokka ${label} from ${name}`,
    html: `
      <h3>New ${escapeHtml(label)}</h3>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Business:</strong> ${escapeHtml(enquiry.business || "—")}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(enquiry.phone || "—")}</p>
      <p><strong>Service:</strong> ${escapeHtml(enquiry.service || "—")}</p>
      <p><strong>Budget:</strong> ${escapeHtml(enquiry.budget || "—")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message || "—").replace(/\n/g, "<br>")}</p>
    `,
  }).catch(() => {});

  return { ok: true, status: 201, body: { success: true, id: enquiry.id } };
}
