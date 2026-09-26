"use client";

import { useEffect, useRef, useState } from "react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

// Module-level emitter so any component (or plain async handler) can fire a
// toast without threading a context through the tree: `toast.success("Saved")`.
type Listener = (t: Toast) => void;
let listener: Listener | null = null;
let nextId = 1;

function emit(kind: ToastKind, message: string) {
  listener?.({ id: nextId++, kind, message });
}

export const toast = {
  success: (message: string) => emit("success", message),
  error: (message: string) => emit("error", message),
  info: (message: string) => emit("info", message),
};

const KIND_CLASSES: Record<ToastKind, string> = {
  success: "border-emerald-500/40 text-emerald-300",
  error: "border-rose-500/40 text-rose-300",
  info: "border-amber-500/40 text-amber-300",
};

const KIND_ICONS: Record<ToastKind, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const DISMISS_MS = 4000;

/** Mount once per shell (admin + portal). Renders stacked, self-dismissing
 *  toasts bottom-right; click a toast to dismiss it early. */
export default function Toaster({ light = false }: { light?: boolean }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    listener = (t) => {
      setToasts((prev) => [...prev.slice(-3), t]);
      timers.current.push(
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id));
        }, DISMISS_MS)
      );
    };
    const pending = timers.current;
    return () => {
      listener = null;
      pending.forEach(clearTimeout);
    };
  }, []);

  return (
    // The live region stays mounted even when empty — screen readers only
    // announce additions to regions that already existed.
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs font-semibold shadow-lg backdrop-blur-md transition text-left max-w-xs animate-toast-in ${
            light ? "bg-white/95 shadow-sand-300/40" : "bg-slate-900/95 shadow-slate-950/50"
          } ${KIND_CLASSES[t.kind]}`}
        >
          <span aria-hidden="true">{KIND_ICONS[t.kind]}</span>
          <span className={light ? "text-sand-800" : "text-slate-200"}>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
