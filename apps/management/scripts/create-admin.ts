// Creates the first staff admin, or resets an existing admin's password, on
// whichever database DATABASE_URL points at. Use this for production instead
// of `db:seed`, which adds demo data and a password that is public in the repo.
//
//   npm run create-admin -- you@example.com
//
// The password is asked for at a prompt so it never lands in shell history.
import { createInterface } from "node:readline/promises";
import { PrismaClient } from "@prisma/client";
import { hashPassword, validatePassword } from "../src/lib/password";

async function main() {
  const username = process.argv[2]?.trim().toLowerCase();
  if (!username) throw new Error("Usage: npm run create-admin -- <email>");

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const password = await rl.question(`Password for ${username}: `);
  rl.close();
  const problem = validatePassword(password);
  if (problem) throw new Error(problem);

  const prisma = new PrismaClient();
  try {
    const passwordHash = hashPassword(password);
    await prisma.user.upsert({
      where: { username },
      update: { passwordHash, isAdmin: true, role: "Administrator" },
      create: { username, passwordHash, isAdmin: true, role: "Administrator" },
    });
    // Existing sessions were signed in with the old password.
    await prisma.session.deleteMany({ where: { user: { username } } });
    console.log(`Admin "${username}" is ready. Sign in at ${process.env.NEXT_PUBLIC_APP_URL ?? "the app"}/login`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
