"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import TodoBar from "./TodoBar";
import NotificationBell from "./NotificationBell";
import Toaster from "../ui/Toaster";
import ConfirmHost from "../ui/ConfirmDialog";

interface NavTab {
  href: string;
  label: string;
  badgeKey?: "clients" | "tasks";
}

const NAV_TABS: NavTab[] = [
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/enquiries", label: "📬 Enquiries" },
  { href: "/requests", label: "📨 Requests" },
  { href: "/change-requests", label: "📝 Change Requests" },
  { href: "/suggestions", label: "💡 Suggestions" },
  { href: "/invoices", label: "🧾 Invoices" },
  { href: "/clients", label: "🤝 Clients", badgeKey: "clients" },
  { href: "/tasks", label: "✅ Tasks", badgeKey: "tasks" },
];

// Client-raised tickets are admin-only (see /api/client-tickets) — an admin
// responds to what the business submits, they don't raise one themselves —
// so this tab only shows up for admins, same as the Admin tab below.
const ADMIN_ONLY_TABS: NavTab[] = [{ href: "/client-tickets", label: "🎫 Portal Tickets" }];

export interface CurrentUser {
  id: number;
  username: string;
  role: string;
  isAdmin: boolean;
}

interface CurrentUserState {
  user: CurrentUser | null;
  /** false until /api/auth/me has answered — render nothing role-gated before then */
  loaded: boolean;
}

const CurrentUserContext = createContext<CurrentUserState>({ user: null, loaded: false });

/** Current staff user, fetched once by the Shell. Pages should use this
 *  instead of fetching /api/auth/me themselves. */
export function useCurrentUser(): CurrentUserState {
  return useContext(CurrentUserContext);
}

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userState, setUserState] = useState<CurrentUserState>({ user: null, loaded: false });
  const [badges, setBadges] = useState<{ clients?: number; tasks?: number }>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => setUserState({ user, loaded: true }))
      .catch(() => setUserState({ user: null, loaded: true }));
  }, []);

  // Keep the search box in sync with ?q= instead of blanking on navigation.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    setSearch(q ?? "");
  }, [pathname]);

  // Nav badges: active clients + open tasks. Refreshed on navigation so the
  // counts stay current, but the Shell (and these numbers) never unmount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((stats) => {
        if (!cancelled && stats) {
          setBadges({ clients: stats.workingOnCount, tasks: stats.openTaskCount });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Close the account menu on outside click or Escape (mouse-leave alone
  // strands the menu open on touch devices and keyboard navigation).
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

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/clients?q=${encodeURIComponent(q)}` : "/clients");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const user = userState.user;
  const navTabs = user?.isAdmin
    ? [...NAV_TABS.slice(0, 1), ...ADMIN_ONLY_TABS, ...NAV_TABS.slice(1), { href: "/admin", label: "🛠️ Admin" }]
    : NAV_TABS;

  const searchInput = (
    <div className="relative w-full">
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 text-sm">
        🔍
      </span>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search clients"
        placeholder="Search clients by name, company, or email..."
        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
      />
    </div>
  );

  return (
    <CurrentUserContext.Provider value={userState}>
      <div className="min-h-full flex flex-col">
        {/* TOP BAR */}
        <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Brand */}
            <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-xl flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
                W
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-white">Web-quokka</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Client OS
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Client Lifecycle &amp; Delivery Management
                </p>
              </div>
            </Link>

            {/* Search — desktop only, a compact mobile version lives in the nav strip below */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-3 flex-1 max-w-md mx-4">
              {searchInput}
            </form>

            <div className="flex items-center gap-2">
              <TodoBar />
              <NotificationBell />

              {/* Account menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 hover:border-amber-500/40 transition"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-bold text-slate-200">
                      {user?.username ?? (userState.loaded ? "Signed out" : "...")}
                    </p>
                    <p className="text-[10px] text-amber-400">{user?.role ?? ""}</p>
                  </div>
                  <span className="text-slate-400 text-base leading-none">⋮</span>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-800 bg-slate-900 shadow-lg shadow-slate-950/40 overflow-hidden text-sm z-50">
                    <div className="px-3 py-2 border-b border-slate-800 lg:hidden">
                      <p className="text-xs font-bold text-slate-200">{user?.username ?? "..."}</p>
                      <p className="text-[10px] text-amber-400">{user?.role ?? ""}</p>
                    </div>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      ⚙️ Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-slate-800"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs + mobile search */}
          <div className="bg-slate-950 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearchSubmit} className="max-w-7xl mx-auto pt-2 md:hidden">
              {searchInput}
            </form>
            <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 py-2 text-xs font-medium overflow-x-auto">
              {navTabs.map((tab) => {
                const isActive = pathname === tab.href || (tab.href !== "/dashboard" && pathname.startsWith(tab.href));
                const badgeCount = tab.badgeKey ? badges[tab.badgeKey] : null;

                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition whitespace-nowrap ${
                      isActive
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/50"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border-transparent"
                    }`}
                  >
                    {tab.label}
                    {badgeCount !== null && badgeCount !== undefined && (
                      <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full text-[10px]">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <Toaster />
        <ConfirmHost />
      </div>
    </CurrentUserContext.Provider>
  );
}
