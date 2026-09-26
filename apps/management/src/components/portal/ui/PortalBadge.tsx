// Light-theme counterpart to src/components/ui/Badge.tsx — full class
// strings per tone so Tailwind's static scanner picks them up.
const TONE_CLASSES: Record<string, string> = {
  sky: "bg-sky-50 text-sky-700 border-sky-200",
  violet: "bg-violet-50 text-violet-700 border-violet-200",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  slate: "bg-sand-100 text-sand-800 border-sand-200",
  teal: "bg-teal-50 text-teal-700 border-teal-200",
  coral: "bg-coral-500/10 text-coral-600 border-coral-500/30",
};

interface Props {
  label: string;
  tone: string;
  className?: string;
}

export default function PortalBadge({ label, tone, className = "" }: Props) {
  const toneClasses = TONE_CLASSES[tone] ?? TONE_CLASSES.slate;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses} ${className}`}>
      {label}
    </span>
  );
}
