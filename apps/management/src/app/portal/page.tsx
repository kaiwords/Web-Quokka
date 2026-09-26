import { redirect } from "next/navigation";

// /portal itself used to 404 (so login?next=/portal dead-ended after
// signing in). The dashboard is the portal's home.
export default function PortalIndexPage() {
  redirect("/portal/dashboard");
}
