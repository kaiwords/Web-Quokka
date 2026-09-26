"use client";

import { toast } from "@/components/ui/Toaster";

interface FetchResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") return body.error;
  } catch {
    // non-JSON body (proxy error page, empty 500) — use the fallback
  }
  return fallback;
}

/** GET helper for page loads. Never throws; check `error` instead of
 *  rendering a failure as an empty list. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) {
      const msg =
        res.status === 401 || res.status === 403
          ? "You don't have access to this."
          : res.status === 404
            ? "Not found."
            : "Something went wrong loading this.";
      return { data: null, error: await parseError(res, msg), status: res.status };
    }
    return { data: (await res.json()) as T, error: null, status: res.status };
  } catch {
    return { data: null, error: "Network error — check your connection.", status: 0 };
  }
}

interface MutateOptions {
  /** Toast shown on success. Omit for silent success (e.g. toggling a checkbox). */
  success?: string;
  /** Fallback toast when the server gives no error message. */
  error?: string;
}

interface MutateResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

/** Mutation helper: checks res.ok, surfaces the server's `error` (or a
 *  fallback) as an error toast, optionally toasts success. Never throws.
 *
 *  const { ok } = await mutate("/api/tasks/1", { method: "PATCH", ... }, { success: "Task updated" });
 *  if (ok) load();
 */
export async function mutate<T = unknown>(
  url: string,
  init: RequestInit,
  opts: MutateOptions = {}
): Promise<MutateResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    if (!res.ok) {
      const msg = await parseError(
        res,
        opts.error ??
          (res.status === 401 || res.status === 403
            ? "You don't have permission to do that."
            : "Something went wrong — please try again.")
      );
      toast.error(msg);
      return { ok: false, data: null, error: msg };
    }
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      // 204 / empty body is fine
    }
    if (opts.success) toast.success(opts.success);
    return { ok: true, data, error: null };
  } catch {
    const msg = "Network error — your change wasn't saved.";
    toast.error(msg);
    return { ok: false, data: null, error: msg };
  }
}

/** Multipart variant of `mutate` for file uploads (no JSON content-type). */
export async function mutateForm<T = unknown>(
  url: string,
  form: FormData,
  opts: MutateOptions = {}
): Promise<MutateResult<T>> {
  try {
    const res = await fetch(url, { method: "POST", body: form });
    if (!res.ok) {
      const msg = await parseError(res, opts.error ?? "Upload failed — please try again.");
      toast.error(msg);
      return { ok: false, data: null, error: msg };
    }
    let data: T | null = null;
    try {
      data = (await res.json()) as T;
    } catch {
      // empty body is fine
    }
    if (opts.success) toast.success(opts.success);
    return { ok: true, data, error: null };
  } catch {
    const msg = "Network error — the upload didn't finish.";
    toast.error(msg);
    return { ok: false, data: null, error: msg };
  }
}
