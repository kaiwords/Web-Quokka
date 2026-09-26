// End-to-end check of the client self-sign-up flow against a running server
// and a real database. Written because the flow spans an API route, a
// database row, an emailed token and a session cookie — the parts can each
// look right while the chain is broken.
//
//   npm run dev                 # in another terminal
//   npm run smoke:signup
//
// Creates a throwaway account and deletes it, along with the Client row it
// creates, whether or not the run passes.
import { PrismaClient } from "@prisma/client";

const BASE = (process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const email = `smoke-${Date.now()}@webquokka-smoke.test`;
const password = "smoke-test-password";
const businessName = "Smoke Test Pty Ltd";

const prisma = new PrismaClient();
let failures = 0;
let createdClientId = null;
let createdPortalUserId = null;

function check(label, ok, detail = "") {
  console.log(`${ok ? "  ok  " : " FAIL "} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
  return ok;
}

async function post(path, body, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  });
  let json = {};
  try {
    json = await res.json();
  } catch {
    // Some responses have no body; the status is what matters.
  }
  return { res, json };
}

try {
  console.log(`\nSmoke test: client self-sign-up\n  server ${BASE}\n  email  ${email}\n`);

  await prisma.$queryRaw`SELECT 1`;
  console.log("  ok   database reachable");

  // 1. Sign up.
  const signup = await post("/api/portal/auth/signup", {
    name: "Smoke Test",
    businessName,
    email,
    password,
  });
  check("sign-up returns 201", signup.res.status === 201, `got ${signup.res.status}`);
  check("sign-up issues no session cookie", !signup.res.headers.get("set-cookie"));

  const user = await prisma.portalUser.findUnique({ where: { email } });
  if (!check("portal user created", Boolean(user))) throw new Error("nothing to continue with");
  createdClientId = user.clientId;
  createdPortalUserId = user.id;

  check("status is PendingVerification", user.status === "PendingVerification", user.status);
  check("email not yet marked verified", user.emailVerifiedAt === null);
  check("role is Owner", user.role === "Owner", user.role);

  const client = await prisma.client.findUnique({ where: { id: user.clientId } });
  check("business record created", Boolean(client));
  check("business marked as a self-signup", client?.source === "SelfSignup", client?.source);
  check("business NOT auto-approved", client?.approvedAt === null);

  // 2. Login must be refused before the address is confirmed.
  const early = await post("/api/portal/auth/login", { email, password });
  check("login refused before verification", early.res.status === 403, `got ${early.res.status}`);
  check("refusal flags needsVerification", early.json.needsVerification === true);
  check("no session cookie issued", !early.res.headers.get("set-cookie"));

  // 3. Confirm, using the token the email would have carried.
  const token = await prisma.portalEmailVerification.findFirst({
    where: { portalUserId: user.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!check("verification token issued", Boolean(token))) throw new Error("no token to redeem");

  const verify = await post("/api/portal/auth/verify-email", { token: token.token });
  check("verification returns 200", verify.res.status === 200, `got ${verify.res.status}`);
  check("verification signs the user in", Boolean(verify.res.headers.get("set-cookie")));

  const verified = await prisma.portalUser.findUnique({ where: { email } });
  check("status is now Active", verified.status === "Active", verified.status);
  check("emailVerifiedAt stamped", verified.emailVerifiedAt !== null);

  // 4. The token is single use.
  const replay = await post("/api/portal/auth/verify-email", { token: token.token });
  check("token cannot be replayed", replay.res.status === 400, `got ${replay.res.status}`);

  // 5. Login now works.
  const login = await post("/api/portal/auth/login", { email, password });
  check("login succeeds after verification", login.res.status === 200, `got ${login.res.status}`);
  check("login issues a session cookie", Boolean(login.res.headers.get("set-cookie")));

  // 6. Signing up again must not reveal that the address is taken.
  const again = await post("/api/portal/auth/signup", {
    name: "Someone Else",
    businessName: "Other Co",
    email,
    password: "another-good-password",
  });
  check("duplicate sign-up does not leak", again.res.status === 201, `got ${again.res.status}`);
  const clientCount = await prisma.client.count({ where: { contactEmail: email } });
  check("duplicate created no second business", clientCount === 1, `found ${clientCount}`);
} catch (error) {
  failures++;
  console.error("\n  ERROR", error.message);
} finally {
  // PortalEmailVerification has no FK to PortalUser (it mirrors
  // PortalPasswordReset), so it is deleted explicitly and BEFORE the client —
  // once the cascade removes the user, its id is gone and the rows would be
  // orphaned. Both are scoped to the ids this run created.
  if (createdPortalUserId !== null) {
    await prisma.portalEmailVerification.deleteMany({
      where: { portalUserId: createdPortalUserId },
    });
  }
  // Deleting the Client cascades to its PortalUser and that user's sessions.
  if (createdClientId !== null) {
    await prisma.client.deleteMany({ where: { id: createdClientId } });
    console.log("\n  cleaned up test account");
  }
  await prisma.$disconnect();
  console.log(failures === 0 ? "\nPASS — all checks green\n" : `\nFAIL — ${failures} check(s) failed\n`);
  process.exit(failures === 0 ? 0 : 1);
}
