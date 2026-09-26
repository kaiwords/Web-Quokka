import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Shows a spinner and disables the button while an action is in flight. */
  loading?: boolean;
}

// Light-theme counterpart to src/components/ui/Button.tsx — same compact
// sizing convention, but tuned for the portal's sand/cream + teal/coral
// palette instead of the staff CRM's dark slate/amber one.
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-teal-600 text-white hover:bg-teal-500 focus-visible:outline-teal-500",
  secondary:
    "border border-sand-300 text-sand-800 hover:border-teal-500 hover:text-teal-700 bg-white focus-visible:outline-teal-500",
  danger:
    "border border-coral-500/40 text-coral-600 hover:bg-coral-500/10 bg-white focus-visible:outline-coral-500",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

/** For styling a <Link> as a button — nesting a <button> inside an <a> is
 *  invalid HTML and creates two tab stops for one action. */
export function portalButtonClasses(variant: Variant = "primary"): string {
  return `${BASE_CLASSES} ${VARIANT_CLASSES[variant]}`;
}

export default function PortalButton({
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}: Props) {
  return (
    <button
      disabled={disabled || loading}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
