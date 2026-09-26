// Minimal in-memory sliding-window limiter — no new dependency, fine for
// this app's single-instance deployment. If it's ever run behind multiple
// instances, this needs to move to a shared store (e.g. Redis).
const attempts = new Map<string, number[]>();

// Without a sweep the map grows forever (worse because callers key on
// spoofable client input like x-forwarded-for).
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;
const MAX_WINDOW_MS = 60 * 60 * 1000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, times] of attempts) {
    const recent = times.filter((t) => now - t < MAX_WINDOW_MS);
    if (recent.length === 0) attempts.delete(key);
    else attempts.set(key, recent);
  }
}

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  attempts.set(key, recent);
  return recent.length > max;
}
