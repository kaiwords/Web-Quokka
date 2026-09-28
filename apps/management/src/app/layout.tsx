import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Brand Guidelines v2: Plus Jakarta Sans for everything but display
// headlines (which only the marketing site sets in Gloock).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Web Quokka | Client Management System",
  description:
    "Client lifecycle and delivery management for Web Quokka — from onboarding and requirements through submission, deployment, and ongoing maintenance.",
  keywords: ["client management", "onboarding", "project delivery", "task tracking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-950">
      <body
        className={`${jakarta.variable} ${jetbrainsMono.variable} h-full font-sans text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950`}
      >
        {children}
      </body>
    </html>
  );
}
