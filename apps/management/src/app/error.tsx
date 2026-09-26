"use client";

// Root error boundary — without one, any uncaught render/fetch error shows
// Next's generic client-exception screen.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="max-w-sm w-full rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
        <p className="text-3xl" aria-hidden="true">
          😵
        </p>
        <h1 className="mt-3 text-base font-bold text-slate-100">Something went wrong</h1>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
          {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
