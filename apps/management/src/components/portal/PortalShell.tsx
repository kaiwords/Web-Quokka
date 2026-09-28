"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Toaster from "../ui/Toaster";
import ConfirmHost from "../ui/ConfirmDialog";

const NAV_ITEMS = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "\u{1F3E0}" },
  { href: "/portal/messages", label: "Messages", icon: "\u{1F4AC}" },
  { href: "/portal/projects", label: "Projects", icon: "\u{1F4C8}" },
  { href: "/portal/tickets", label: "Support Tickets", icon: "\u{1F3AB}" },
  { href: "/portal/change-requests", label: "Change Requests", icon: "\u{1F4DD}" },
  { href: "/portal/suggestions", label: "Suggestions", icon: "\u{1F4A1}" },
  { href: "/portal/invoices", label: "Invoices", icon: "\u{1F9FE}" },
  { href: "/portal/services", label: "My Services", icon: "\u{1F310}" },
];

export interface PortalCurrentUser {
  id: number;
  clientId: number;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Viewer";
}

interface PortalUserState {
  user: PortalCurrentUser | null;
  /** false until /api/portal/auth/me has answered */
  loaded: boolean;
}

const PortalUserContext = createContext<PortalUserState>({ user: null, loaded: false });

/** Current portal user (with role), fetched once by the shell. Pages should
 *  use this to hide or disable actions Viewers aren't allowed to take. */
export function usePortalUser(): PortalUserState {
  return useContext(PortalUserContext);
}

/** Convenience: Viewers are read-only; Owners/Managers can act. */
export function canAct(user: PortalCurrentUser | null): boolean {
  return user?.role === "Owner" || user?.role === "Manager";
}

interface PortalShellProps {
  children: React.ReactNode;
}

export default function PortalShell({ children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userState, setUserState] = useState<PortalUserState>({ user: null, loaded: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/portal/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => setUserState({ user, loaded: true }))
      .catch(() => setUserState({ user: null, loaded: true }));
  }, []);

  // Expired session: send them to login instead of a shell stuck on "...".
  useEffect(() => {
    if (userState.loaded && !userState.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userState.loaded, userState.user]);

  // The portal is a light surface: flip the document to light color-scheme
  // so scrollbars, selection and the focus ring match (see globals.css).
  useEffect(() => {
    document.documentElement.classList.add("theme-light");
    return () => document.documentElement.classList.remove("theme-light");
  }, []);

  // Close the account menu on outside click or Escape (mouse-leave alone
  // strands it open on touch devices and keyboard navigation).
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const user = userState.user;
  const navItems =
    user?.role === "Owner"
      ? [...NAV_ITEMS, { href: "/portal/team", label: "Team", icon: "\u{1F465}" }]
      : NAV_ITEMS;

  return (
    <PortalUserContext.Provider value={userState}>
      <div className="min-h-full flex bg-sand-50 text-sand-900">
        {/* SIDEBAR */}
        <aside
          className={`${collapsed ? "w-16" : "w-60"} shrink-0 border-r border-sand-200 bg-white transition-all duration-200 hidden sm:flex flex-col`}
        >
          <div className="h-16 flex items-center gap-3 px-4 border-b border-sand-200">
            {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset */}
            <img src="/brand/mascot-brown.png" alt="Web Quokka" className="w-9 h-9 shrink-0 object-contain" />
            {!collapsed && (
              <div>
                <p className="font-bold text-sm text-sand-900 leading-tight">Web Quokka</p>
                <p className="text-[10px] text-sand-600 leading-tight">Client Portal</p>
              </div>
            )}
          </div>

          <nav className="flex-1 py-4 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "bg-teal-50 text-teal-700" : "text-sand-700 hover:bg-sand-100"
                  }`}
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="m-2 rounded-lg px-3 py-2 text-xs text-sand-500 hover:bg-sand-100 text-left"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "»" : "« Collapse"}
          </button>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          {/* TOP BAR */}
          <header className="h-16 border-b border-sand-200 bg-white sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6">
            <p className="text-sm font-semibold text-sand-800 sm:hidden">Web Quokka</p>
            <div className="hidden sm:block" />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="Account menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-lg border border-sand-200 px-3 py-1.5 hover:border-teal-400 transition"
              >
                <div className="text-right hidden md:block">
                  <p className="text-xs font-bold text-sand-900">{user?.name ?? "..."}</p>
                  <p className="text-[10px] text-teal-600">{user?.role ?? ""}</p>
                </div>
                <span className="text-sand-400 text-base leading-none">{"⋮"}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-lg border border-sand-200 bg-white shadow-lg overflow-hidden text-sm z-50">
                  <div className="px-3 py-2 border-b border-sand-200 md:hidden">
                    <p className="text-xs font-bold text-sand-900">{user?.name ?? "..."}</p>
                    <p className="text-[10px] text-teal-600">{user?.role ?? ""}</p>
                  </div>
                  <Link
                    href="/portal/account"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-1.5 text-xs text-sand-700 hover:bg-sand-50"
                  >
                    Account Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-1.5 text-xs text-coral-600 hover:bg-sand-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Mobile nav strip */}
          <div className="sm:hidden bg-white border-b border-sand-200 px-2 py-2 flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                    isActive ? "bg-teal-50 text-teal-700" : "text-sand-600 hover:bg-sand-100 hover:text-sand-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">{children}</main>
        </div>

        <Toaster light />
        <ConfirmHost light />
      </div>
    </PortalUserContext.Provider>
  );
}
