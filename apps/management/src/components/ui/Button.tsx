import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Shows a spinner and disables the button — pass your in-flight flag here
   *  instead of hand-rolling "Saving..." labels and double-submit guards. */
  loading?: boolean;
}

// Full class strings per variant (no dynamic template strings — see Badge.tsx
// for why: Tailwind's static scanner needs literal class names).
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-500 text-slate-950 hover:bg-amber-400 focus-visible:outline-amber-400",
  success:
    "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus-visible:outline-emerald-400",
  secondary:
    "border border-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-600 hover:bg-slate-900 focus-visible:outline-slate-400",
  danger:
    "border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50 focus-visible:outline-rose-400",
  ghost:
    "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 focus-visible:outline-slate-400",
};

// One compact size app-wide — buttons had drifted to an oversized px-4/py-2
// scale that didn't match the rest of the (already compact) UI.
export default function Button({
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="h-3 w-3 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
