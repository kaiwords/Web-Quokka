import { redirect } from "next/navigation";

// /admin is the entry point for the admin area; Team is its first tab.
export default function AdminIndexPage() {
  redirect("/admin/users");
}
