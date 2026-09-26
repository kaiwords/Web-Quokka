import Shell from "@/components/layout/Shell";

// One persistent Shell for every staff page. Pages used to each mount their
// own <Shell>, which refetched /api/auth/me and /api/todos on every
// navigation, flashed "..." in the header, and dropped in-flight toasts.
export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>;
}
