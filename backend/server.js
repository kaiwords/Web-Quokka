import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import supabase from "./db/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const gmailUser = process.env.GMAIL_USER;
const gmailTo = process.env.GMAIL_TO;
const gmailPassword = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

const transporter = gmailUser && gmailPassword
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    })
  : null;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── POST /api/contact ─────────────────────────────────────────────────────────
app.post("/api/contact", async (req, res) => {
  const { name, business, email, phone, service, message } = req.body;

  if (!name || !email || !service || !message) {
    return res.status(400).json({ error: "name, email, service, and message are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;

  const { data, error } = await supabase
    .from("enquiries")
    .insert([{
      name: name.trim(),
      business: business?.trim() || null,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      service: service.trim(),
      message: message.trim(),
      ip_address: ip,
    }])
    .select("id, created_at")
    .single();

  if (error) {
    console.error("Supabase error saving enquiry:", error);
    return res.status(500).json({ error: "Failed to save your message. Please try again." });
  }

  if (transporter && gmailTo) {
    try {
      await transporter.sendMail({
        from: gmailUser,
        to: gmailTo,
        subject: `New Web Quokka enquiry from ${name.trim()}`,
        text: [
          `Name: ${name.trim()}`,
          `Business: ${business?.trim() || "N/A"}`,
          `Email: ${email.trim().toLowerCase()}`,
          `Phone: ${phone?.trim() || "N/A"}`,
          `Service: ${service.trim()}`,
          "",
          "Project details:",
          message.trim(),
        ].join("\n"),
        html: `
          <h3>New Web Quokka enquiry</h3>
          <p><strong>Name:</strong> ${name.trim()}</p>
          <p><strong>Business:</strong> ${business?.trim() || "N/A"}</p>
          <p><strong>Email:</strong> ${email.trim().toLowerCase()}</p>
          <p><strong>Phone:</strong> ${phone?.trim() || "N/A"}</p>
          <p><strong>Service:</strong> ${service.trim()}</p>
          <p><strong>Message:</strong></p>
          <p>${message.trim().replace(/\n/g, "<br>")}</p>
        `,
      });
      console.log(`Email sent for enquiry #${data.id} to ${gmailTo}`);
    } catch (mailError) {
      console.error("Failed to send enquiry email:", mailError);
    }
  }

  console.log(`[${data.created_at}] New enquiry #${data.id} from ${email}`);
  return res.status(201).json({ success: true, id: data.id });
});

// ── GET /api/enquiries ────────────────────────────────────────────────────────
// Requires X-Admin-Key header matching ADMIN_API_KEY env var
app.get("/api/enquiries", async (req, res) => {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey || req.headers["x-admin-key"] !== adminKey) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const { data, error } = await supabase
    .from("enquiries")
    .select("id, name, business, email, phone, service, message, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error fetching enquiries:", error);
    return res.status(500).json({ error: "Failed to retrieve enquiries." });
  }

  return res.json(data);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Web Quokka backend running on http://localhost:${PORT}`);
});
