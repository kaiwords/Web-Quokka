"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchJson, mutate } from "@/lib/clientApi";
import { NOTIFICATION_ICON, timeAgo, type Notification } from "@/types";

const POLL_MS = 60_000;

// The in-app inbox in the top bar. Same popover behaviour as TodoBar and the
// Shell's account menu (outside click + Escape to close).
export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetchJson<{ items: Notification[]; unreadCount: number }>("/api/notifications");
    if (res.error || !res.data) {
      setLoadError(true);
    } else {
      setLoadError(false);
      setItems(Array.isArray(res.data.items) ? res.data.items : []);
      setUnread(res.data.unreadCount ?? 0);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll for new arrivals. Skipped while the panel is open so the list
  // doesn't reshuffle under the cursor mid-click, and while the tab is
  // hidden so a backgrounded tab isn't polling all day.
  useEffect(() => {
    const id = setInterval(() => {
      if (!open && document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function openNotification(n: Notification) {
    setOpen(false);
    // Optimistic: the row should stop looking unread immediately, and the
    // navigation below unmounts this panel before any refetch could land.
    if (!n.readAt) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      await mutate("/api/notifications", { method: "PATCH", body: JSON.stringify({ id: n.id }) });
    }
    if (n.link) router.push(n.link);
  }

  async function markAllRead() {
    setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: new Date().toISOString() })));
    setUnread(0);
    await mutate("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
    load();
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        aria-expanded={open}
        className="relative flex items-center rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-base leading-none hover:border-amber-500/40 transition"
      >
        <span aria-hidden="true">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4.5 rounded-full bg-amber-500 px-1 text-[10px] font-bold leading-4.5 text-slate-950">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-800 bg-slate-900 shadow-lg shadow-slate-950/40 overflow-hidden z-50">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <p className="text-xs font-bold text-slate-200">Notifications</p>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-amber-400 hover:text-amber-300 underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {!loaded ? (
              <p className="px-3 py-4 text-xs text-slate-500">Loading...</p>
            ) : loadError ? (
              <p className="px-3 py-4 text-xs text-rose-400">Couldn&apos;t load notifications.</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-500">Nothing yet. 🎉</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`flex w-full gap-2.5 border-b border-slate-800/60 px-3 py-2.5 text-left transition hover:bg-slate-800/60 ${
                    n.readAt ? "" : "bg-amber-500/5"
                  }`}
                >
                  <span aria-hidden="true" className="text-sm leading-5">
                    {NOTIFICATION_ICON[n.type] ?? "🔔"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-xs ${n.readAt ? "text-slate-300" : "font-semibold text-slate-100"}`}>
                      {n.title}
                    </span>
                    {n.body && <span className="mt-0.5 block text-[11px] text-slate-400">{n.body}</span>}
                    <span className="mt-1 block text-[10px] text-slate-500">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.readAt && (
                    <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
