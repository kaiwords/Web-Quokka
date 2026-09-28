"use client";

import { useCallback, useEffect, useState } from "react";
import PortalButton from "@/components/portal/ui/PortalButton";
import { canAct, usePortalUser } from "@/components/portal/PortalShell";
import { fetchJson, mutate } from "@/lib/clientApi";
import { formatDateTime, type Message } from "@/types";

// The business's direct conversation with the Web Quokka team — one running
// thread, not per-ticket. Anything tied to a specific piece of work still
// belongs on that ticket or change request.
export default function PortalMessagesPage() {
  const { user, loaded } = usePortalUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchJson<Message[]>("/api/portal/messages");
    if (res.data) {
      setMessages(res.data);
      setError(null);
    } else {
      setError(res.error ?? "Something went wrong loading this.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function retry() {
    setLoading(true);
    setError(null);
    void load();
  }

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(
        "/api/portal/messages",
        { method: "POST", body: JSON.stringify({ body }) },
        { error: "Your message didn't send — please try again." }
      );
      // Only clear the box once the message is actually saved — a failed
      // send must not throw away what was typed.
      if (ok) {
        setDraft("");
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  function onDraftKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      void send();
    }
  }

  const mayAct = loaded && canAct(user);

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sand-900">Messages</h1>
          <p className="mt-1 text-sm text-sand-600">
            A direct line to the Web Quokka team. For a bug or a specific piece of work, a support ticket or change
            request will get looked after faster.
          </p>
          {loaded && user && !canAct(user) && (
            <p className="mt-1 text-xs text-sand-400">View-only access — an account owner or manager can send messages.</p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-sand-600">Loading...</p>
        ) : error ? (
          <div className="rounded-2xl border border-coral-500/30 bg-coral-500/5 p-5">
            <p className="text-sm text-coral-600">{error}</p>
            <div className="mt-3">
              <PortalButton variant="secondary" onClick={retry}>
                Retry
              </PortalButton>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            {messages.length === 0 ? (
              <p className="text-xs text-sand-500">No messages yet — say hello, or ask us anything about your project.</p>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`rounded-xl p-3 text-sm ${m.authorType === "System" ? "text-sand-400 text-xs italic" : m.authorType === "Portal" ? "bg-teal-50 text-sand-800" : "bg-sand-50 text-sand-800"}`}
                  >
                    {m.authorType !== "System" && (
                      <p className="text-xs font-semibold text-sand-600 mb-1">
                        {m.authorName}
                        {m.authorType === "Staff" && " · Web Quokka"}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[10px] text-sand-400">{formatDateTime(m.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}

            {mayAct && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
                className="mt-4 space-y-2"
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onDraftKeyDown}
                  placeholder="Write a message..."
                  aria-label="Write a message"
                  rows={2}
                  className="w-full resize-y rounded-lg border border-sand-200 px-3 py-2 text-sm text-sand-900 focus:border-teal-500 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-sand-400">Tip: press Ctrl+Enter (⌘+Enter on Mac) to send.</p>
                  <PortalButton type="submit" loading={sending} disabled={!draft.trim()}>
                    Send
                  </PortalButton>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
