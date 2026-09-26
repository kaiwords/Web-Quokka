// Small server-side validation helpers shared by API routes.

/** Parse a route id segment. Returns null for anything that isn't a positive
 *  integer, so routes can 400/404 instead of throwing a 500 in Prisma. */
export function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = parseInt(raw, 10);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Copy only the allowed keys from an untrusted request body. NEVER spread a
 *  request body into prisma.update — nested relation writes ride along (that's
 *  how a todo PATCH could set user.isAdmin). */
export function pick<T extends Record<string, unknown>>(
  body: T,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) out[key] = body[key];
  }
  return out;
}

/** True when the value is one of the allowed enum strings. */
export function isOneOf(value: unknown, allowed: readonly string[]): value is string {
  return typeof value === "string" && allowed.includes(value);
}

/** Parse a money amount (string or number) into a positive decimal string
 *  with 2dp, or null when invalid. Rejects "", "abc", "1,500", negatives, 0. */
export function parseMoney(value: unknown): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return null;
    return value.toFixed(2);
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const n = parseFloat(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n.toFixed(2);
}

/** Parse an ISO-ish date string into a Date, or null when invalid. */
export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Normalise an email for storage/lookup: trim + lowercase. SQLite compares
 *  text case-sensitively, so "Jane@X.com" and "jane@x.com" would otherwise be
 *  two different accounts. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

/** Escape a user-supplied string for interpolation into email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
