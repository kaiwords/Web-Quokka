import PortalShell from "@/components/portal/PortalShell";

// One persistent shell for all signed-in portal pages (auth pages live
// outside this group). Pages used to each mount their own <PortalShell>,
// which reset the sidebar, refetched /me and flashed "..." on every
// navigation.
export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
