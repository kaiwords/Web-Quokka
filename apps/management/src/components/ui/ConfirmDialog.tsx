"use client";

import { useEffect, useRef, useState } from "react";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" renders the confirm button in rose; "default" in amber. */
  tone?: "danger" | "default";
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void;
}

// Promise-based drop-in for window.confirm:
//   if (!(await confirmAction({ title: "Delete this task?" }))) return;
type Opener = (p: PendingConfirm) => void;
let opener: Opener | null = null;

export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (opener) {
      opener({ ...opts, resolve });
    } else {
      // Host not mounted (shouldn't happen) — fall back to native confirm
      // rather than silently approving a destructive action.
      resolve(window.confirm(opts.message ? `${opts.title}\n\n${opts.message}` : opts.title));
    }
  });
}

/** Mount once per shell. `light` renders the portal (sand) styling. */
export default function ConfirmHost({ light = false }: { light?: boolean }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    opener = (p) => {
      previousFocus.current = document.activeElement as HTMLElement | null;
      setPending((existing) => {
        existing?.resolve(false);
        return p;
      });
    };
    return () => {
      opener = null;
    };
  }, []);

  useEffect(() => {
    if (pending) confirmRef.current?.focus();
    else previousFocus.current?.focus?.();
  }, [pending]);

  if (!pending) return null;

  function close(ok: boolean) {
    pending?.resolve(ok);
    setPending(null);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close(false);
    }
    // Two focusables only — make Tab cycle between them in both directions.
    if (e.key === "Tab") {
      e.preventDefault();
      const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>("button");
      const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement);
      buttons[(idx + 1) % buttons.length]?.focus();
    }
  }

  const danger = (pending.tone ?? "danger") === "danger";

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onKeyDown={onKeyDown}
    >
      <div
        className={`absolute inset-0 ${light ? "bg-sand-900/40" : "bg-slate-950/70"} backdrop-blur-sm`}
        onClick={() => close(false)}
        aria-hidden="true"
      />
      <div
        className={`relative w-full max-w-sm rounded-xl border p-5 shadow-2xl animate-toast-in ${
          light
            ? "bg-white border-sand-200 shadow-sand-900/20"
            : "bg-slate-900 border-slate-800 shadow-slate-950/60"
        }`}
      >
        <h2
          id="confirm-title"
          className={`text-sm font-bold ${light ? "text-sand-900" : "text-slate-100"}`}
        >
          {pending.title}
        </h2>
        {pending.message && (
          <p className={`mt-2 text-xs leading-relaxed ${light ? "text-sand-600" : "text-slate-400"}`}>
            {pending.message}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => close(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${
              light
                ? "border-sand-200 text-sand-700 hover:bg-sand-50"
                : "border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-600"
            }`}
          >
            {pending.cancelLabel ?? "Cancel"}
          </button>
          <button
            ref={confirmRef}
            onClick={() => close(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              danger
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : light
                  ? "bg-teal-600 text-white hover:bg-teal-500"
                  : "bg-amber-500 text-slate-950 hover:bg-amber-400"
            }`}
          >
            {pending.confirmLabel ?? "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
