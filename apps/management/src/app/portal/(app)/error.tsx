"use client";

// Portal error boundary, styled for the light sand theme so clients never
// see the dark staff error screen (or Next's generic one).
export default function PortalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="max-w-sm w-full rounded-xl border border-sand-200 bg-white p-6 text-center shadow-sm">
        <p className="text-3xl" aria-hidden="true">
          🐾
        </p>
        <h1 className="mt-3 text-base font-bold text-sand-900">Something went wrong</h1>
        <p className="mt-2 text-xs text-sand-600 leading-relaxed">
          We couldn&apos;t load this page. Please try again — if it keeps happening, raise a
          support ticket and we&apos;ll look into it.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-teal-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-teal-500 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
