import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding web-quokka client database...");

  // ---- Admin account (idempotent — migrates a legacy admin in place rather
  // than creating a second admin account) ----
  const adminUsername = "quokkasupport@gmail.com";
  const adminPassword = "Admin@026";

  // Backfill: rows created back when "role" doubled as the permission flag
  // (role === "Admin") now need the real isAdmin flag set explicitly.
  await prisma.user.updateMany({ where: { role: "Admin", isAdmin: false }, data: { isAdmin: true } });

  const existingAdmin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (existingAdmin && existingAdmin.username !== adminUsername) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { username: adminUsername, passwordHash: hashPassword(adminPassword), role: "Administrator" },
    });
    console.log(`✅ Migrated admin account to username "${adminUsername}"`);
  } else if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: hashPassword(adminPassword),
        role: "Administrator",
        isAdmin: true,
      },
    });
    console.log(`✅ Created admin account — username: "${adminUsername}"`);
  } else {
    console.log("ℹ️  Admin account already up to date, skipping");
  }

  // Clear existing client data so re-seeding is idempotent. User accounts are
  // left untouched (see upsert-style admin creation above).
  await prisma.task.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.client.deleteMany();

  // ---- Onboarding: brand new lead, requirements not gathered yet ----
  await prisma.client.create({
    data: {
      name: "Kangaroo Coffee Co.",
      company: "Kangaroo Coffee Co.",
      contactEmail: "alex@kangacoffee.com.au",
      contactPhone: "+61 4 1234 5678",
      stage: "Onboarding",
      paymentStatus: "NotPaid",
      totalAmount: "8,500",
      notes: "First call went well — booking a discovery workshop next week.",
      tasks: {
        create: [{ title: "Send onboarding welcome pack", assignee: "Account Manager", status: "Todo" }],
      },
    },
  });

  // ---- Deployment: mid-pipeline, MVP sent but not yet approved ----
  await prisma.client.create({
    data: {
      name: "Perth Solar Tech",
      company: "Perth Solar Tech Pty Ltd",
      contactEmail: "contact@perthsolar.au",
      contactPhone: "+61 8 9876 5432",
      stage: "Deployment",
      paymentStatus: "PartiallyPaid",
      amountPaid: "6,000",
      totalAmount: "12,000",
      mvpSentAt: new Date("2026-09-10"),
      notes: "Waiting on client feedback for the MVP before final deployment.",
      requirements: {
        create: [
          {
            role: "Homeowner",
            functionality: "calculate instant solar savings",
            value: "I can request an accurate quote",
            priority: "Must",
          },
          {
            role: "Sales Lead",
            functionality: "manage lead submissions",
            value: "I follow up instantly",
            priority: "Must",
          },
        ],
      },
      tasks: {
        create: [
          { title: "Deploy staging environment", assignee: "Developer", status: "Done" },
          { title: "Solar savings calculator widget", assignee: "Developer", status: "Done" },
          { title: "Follow up on MVP feedback", assignee: "Project Lead", status: "InProgress" },
        ],
      },
    },
  });

  // ---- Maintenance: live client, ongoing retainer work — also the demo
  // client portal account (see below) ----
  const oceanic = await prisma.client.create({
    data: {
      name: "Oceanic Real Estate",
      company: "Oceanic Real Estate Group",
      contactEmail: "ops@oceanicrealestate.com.au",
      contactPhone: "+61 2 5555 1010",
      stage: "Maintenance",
      paymentStatus: "Paid",
      amountPaid: "18,000",
      totalAmount: "18,000",
      mvpSentAt: new Date("2026-02-01"),
      mvpApprovedAt: new Date("2026-02-05"),
      notes: "Standard SLA retainer — monthly maintenance window is the first Monday.",
      requirements: {
        create: [
          {
            role: "Agent",
            functionality: "list a new property in under 2 minutes",
            value: "I can respond to sellers same-day",
            priority: "Must",
          },
        ],
      },
      tasks: {
        create: [
          { title: "Monthly dependency + security patch", assignee: "Developer", status: "InProgress" },
          { title: "Review uptime report with client", assignee: "Account Manager", status: "Done" },
          { title: "Add saved-search email alerts", assignee: "Developer", status: "Cancelled" },
        ],
      },
    },
  });

  // ---- Completed: worked-with archive ----
  await prisma.client.create({
    data: {
      name: "Metro Fitness Hub",
      company: "Metro Fitness Hub",
      contactEmail: "hello@metrofitnesshub.com",
      contactPhone: "+61 3 4444 2020",
      stage: "Completed",
      paymentStatus: "Paid",
      amountPaid: "9,500",
      totalAmount: "9,500",
      mvpSentAt: new Date("2025-11-15"),
      mvpApprovedAt: new Date("2025-11-20"),
      notes: "Project closed out — booking system launched Nov 2025, no active retainer.",
      requirements: {
        create: [
          {
            role: "Member",
            functionality: "book a class from their phone",
            value: "I don't have to call the front desk",
            priority: "Must",
          },
        ],
      },
      tasks: {
        create: [
          { title: "Final handover documentation", assignee: "Project Lead", status: "Done" },
          { title: "Client sign-off on final submission", assignee: "Account Manager", status: "Done" },
        ],
      },
    },
  });

  // ---- Client portal demo data, built on Oceanic Real Estate ----
  const portalOwnerEmail = "demo@oceanicrealestate.com.au";
  const portalOwnerPassword = "Portal@026";
  // Client.deleteMany() above already cascaded away any previously seeded
  // PortalUser (see the Cascade on PortalUser.client), so this always
  // creates fresh rather than needing an upsert.
  const portalOwner = await prisma.portalUser.create({
    data: {
      clientId: oceanic.id,
      name: "Priya Nair",
      email: portalOwnerEmail,
      passwordHash: hashPassword(portalOwnerPassword),
      role: "Owner",
      status: "Active",
      // Staff-invited, so the address is proven by the invite itself. Without
      // this the demo account looks like an unconfirmed self-signup.
      emailVerifiedAt: new Date(),
    },
  });

  const project = await prisma.project.create({
    data: {
      clientId: oceanic.id,
      name: "Oceanic Real Estate — Site Refresh",
      status: "Maintenance",
      stagingUrl: "https://staging.oceanicrealestate.example.com",
      liveUrl: "https://oceanicrealestate.com.au",
      milestones: {
        create: [
          {
            title: "Discovery & requirements",
            status: "Completed",
            order: 0,
            approvalStatus: "Approved",
            approvalComment: "Looks great, thanks team!",
            approvedByPortalUserId: portalOwner.id,
            approvedAt: new Date("2026-08-01"),
            tasks: { create: [{ title: "Stakeholder interviews", done: true, order: 0 }] },
          },
          {
            title: "Saved-search email alerts",
            status: "InProgress",
            order: 1,
            tasks: {
              create: [
                { title: "Design alert email template", done: true, order: 0 },
                { title: "Build alert scheduling job", done: false, order: 1 },
              ],
            },
          },
          { title: "Performance & SEO pass", status: "Upcoming", order: 2, tasks: { create: [] } },
        ],
      },
      updates: {
        create: [{ body: "Kicked off the saved-search alerts feature this week — design mockups attached.", postedBy: adminUsername, imageUrls: "[]", links: "[]" }],
      },
    },
  });

  const ticket = await prisma.ticket.create({
    data: {
      source: "Client",
      title: "Property photos not loading on mobile",
      category: "Bug",
      priority: "High",
      status: "Open",
      description: "On iPhone Safari, the listing photo gallery shows a blank grey box instead of images.",
      clientId: oceanic.id,
      createdByPortalUserId: portalOwner.id,
      createdBy: portalOwner.name,
    },
  });
  await prisma.message.create({
    data: { threadType: "Ticket", threadId: ticket.id, authorType: "Portal", authorName: portalOwner.name, body: "Happy to hop on a call if that's easier to diagnose." },
  });

  await prisma.changeRequest.create({
    data: {
      clientId: oceanic.id,
      projectId: project.id,
      title: "Add a 'schedule a viewing' button to listings",
      description: "Buyers keep emailing to ask for viewing times — would love a direct booking button on each listing page.",
      pageSection: "Listing detail page",
      status: "QuoteSent",
      quoteAmount: "650.00",
      quoteEstimatedTime: "3-4 business days",
      createdByPortalUserId: portalOwner.id,
    },
  });

  // ---- Services, invoices, suggestions (phase 2) ----
  await prisma.service.createMany({
    data: [
      { clientId: oceanic.id, type: "Domain", provider: "Namecheap", planName: "oceanicrealestate.com.au", notes: "Auto-renew on" },
      { clientId: oceanic.id, type: "Hosting", provider: "Vercel", planName: "Pro plan", notes: "" },
      { clientId: oceanic.id, type: "SSL", provider: "Let's Encrypt", planName: "Auto-renewing", notes: "" },
    ],
  });

  // A paid invoice (a past manual invoice) and an unpaid one, so both states
  // are visible in the demo without needing to click through the pay flow.
  await prisma.invoice.create({
    data: {
      clientId: oceanic.id,
      sourceType: "Manual",
      description: "August hosting top-up",
      amountExGst: "120.00",
      gstAmount: "12.00",
      totalAmount: "132.00",
      status: "Paid",
      issueDate: new Date("2026-08-05"),
      paidAt: new Date("2026-08-06"),
    },
  });
  await prisma.invoice.create({
    data: {
      clientId: oceanic.id,
      sourceType: "Manual",
      description: "Priority support hour (September)",
      amountExGst: "90.00",
      gstAmount: "9.00",
      totalAmount: "99.00",
      status: "Unpaid",
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });

  await prisma.suggestion.create({
    data: {
      clientId: oceanic.id,
      projectId: project.id,
      title: "Add structured data for property listings (SEO)",
      category: "SEO",
      description: "Adding schema.org RealEstateListing markup should improve how listings show up in Google search results.",
      expectedBenefit: "Better search visibility and richer result snippets for each listing.",
      priority: "Medium",
      estimatedCost: "350.00",
      estimatedTime: "2 business days",
      createdBy: adminUsername,
    },
  });

  // Seeded clients stand in for staff-onboarded businesses, so they are
  // approved. Only self-signups from the website arrive with approvedAt null.
  await prisma.client.updateMany({
    where: { approvedAt: null },
    data: { source: "Staff", approvedAt: new Date(), approvedBy: adminUsername },
  });

  console.log(`✅ Portal demo account — email: "${portalOwnerEmail}", password: "${portalOwnerPassword}"`);
  console.log("✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
