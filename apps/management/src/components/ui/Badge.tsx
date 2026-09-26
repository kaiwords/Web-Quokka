// Full class strings per tone so Tailwind's static scanner picks them up
// (dynamic template strings like `bg-${tone}-500/10` are invisible to it).
const TONE_CLASSES: Record<string, string> = {
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  slate: "bg-slate-500/10 text-slate-300 border-slate-500/30",
};

interface BadgeProps {
  label: string;
  tone: string;
  className?: string;
}

export default function Badge({ label, tone, className = "" }: BadgeProps) {
  const toneClasses = TONE_CLASSES[tone] ?? TONE_CLASSES.slate;
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${toneClasses} ${className}`}
    >
      {label}
    </span>
  );
}
