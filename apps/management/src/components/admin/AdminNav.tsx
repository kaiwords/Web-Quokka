"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/users", label: "Team (staff accounts)" },
  { href: "/admin/businesses", label: "Clients & portal access" },
];

// Sub-navigation for the admin area. Every /admin/* page is admin-only —
// src/proxy.ts redirects non-admins before these render.
export default function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap gap-2 text-xs font-medium">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg border px-3 py-1.5 transition ${
              active
                ? "bg-amber-500/15 text-amber-400 border-amber-500/50"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
