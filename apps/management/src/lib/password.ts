import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEY_LENGTH = 64;

// Stored as "salt:hash", both hex. No extra dependency (bcrypt/argon2) —
// Node's built-in scrypt is a fine KDF for this app's threat model.
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const suppliedBuffer = scryptSync(password, salt, KEY_LENGTH);
  return hashBuffer.length === suppliedBuffer.length && timingSafeEqual(hashBuffer, suppliedBuffer);
}

// One policy for every flow that sets a password: a reset must not be able to
// weaken a password below what sign-up demanded. Defined in @/types so the
// sign-up form can show it (this module imports node:crypto), re-exported
// here so server code has one import for the whole policy.
export { MIN_PASSWORD_LENGTH } from "@/types";
import { MIN_PASSWORD_LENGTH } from "@/types";

/** Null when acceptable, otherwise the message to show the user. Length is
 *  the only hard rule — composition rules (a digit, a symbol) push people
 *  toward "Password1!" and buy less than the extra characters do. */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== "string" || !password) return "Please enter a password.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  // scrypt runs over the whole input, so an unbounded password is a cheap
  // way to make the server do expensive work.
  if (password.length > 200) return "Password must be 200 characters or fewer.";
  return null;
}
