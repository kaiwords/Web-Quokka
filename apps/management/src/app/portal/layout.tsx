import type { Metadata } from "next";

// Clients should see the portal's name in the tab, not the internal CRM's
// "Client Management System" title from the root layout.
export const metadata: Metadata = {
  title: "Client Portal | Web Quokka",
  description: "Track your projects, invoices, tickets and requests with Web Quokka.",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
