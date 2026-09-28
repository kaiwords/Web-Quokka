"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { fetchJson, mutate } from "@/lib/clientApi";
import { formatDateTime, type Message } from "@/types";

interface Props {
  clientId: number;
  isAdmin: boolean;
}

// The direct staff <-> client conversation shown on the client detail page.
// Anyone on staff can read it; only admins can send — the API enforces that,
// this just swaps the composer for a note that would otherwise 403.
export default function ClientMessagesPanel({ clientId, isAdmin }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await fetchJson<Message[]>(`/api/clients/${clientId}/messages`);
    if (error) {
      setLoadError(error);
    } else {
      setLoadError(null);
      setMessages(data || []);
    }
    setLoaded(true);
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const { ok } = await mutate(`/api/clients/${clientId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      if (ok) {
        setDraft(""); // only clear once the server has it — a failure keeps the draft
        await load();
      }
    } finally {
      setSending(false);
    }
  }

  if (!loaded) return <p className="text-xs text-slate-500">Loading...</p>;

  return (
    <div>
      {loadError ? (
        <p className="text-xs text-rose-400">
          {loadError}{" "}
          <button
            type="button"
            onClick={() => {
              setLoaded(false);
              void load();
            }}
            className="underline hover:text-rose-300"
          >
            Retry
          </button>
        </p>
      ) : messages.length === 0 ? (
        <p className="text-xs text-slate-500">No messages yet — messages you send appear in the client&apos;s portal.</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-lg p-3 text-sm ${m.authorType === "System" ? "text-slate-500 text-xs italic" : m.authorType === "Staff" ? "bg-amber-500/10 text-slate-200" : "bg-slate-950/40 text-slate-200"}`}
            >
              {m.authorType !== "System" && <p className="text-xs font-semibold text-slate-400 mb-1">{m.authorName}</p>}
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[10px] text-slate-500">{formatDateTime(m.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}

      {isAdmin ? (
        <form onSubmit={send} className="mt-4 flex items-start gap-2">
          <div className="flex-1">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={2}
              placeholder="Message the client..."
              aria-label="Message the client"
            />
            <p className="mt-1 text-[10px] text-slate-500">Ctrl/⌘ + Enter to send</p>
          </div>
          <Button type="submit" loading={sending} disabled={!draft.trim()}>
            Send
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Only admins can message the client.</p>
      )}
    </div>
  );
}
