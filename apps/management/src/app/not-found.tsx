import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          🔎
        </p>
        <h1 className="mt-3 text-base font-bold text-slate-100">Page not found</h1>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-block rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
