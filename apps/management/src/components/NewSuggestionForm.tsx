"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { fetchJson, mutate } from "@/lib/clientApi";
import { SUGGESTION_CATEGORIES, type SuggestionCategory, type SuggestionPriority } from "@/types";

interface ClientOption {
  id: number;
  name: string;
  company: string;
}

interface Props {
  // Fixed business (client detail page); omit to show a business picker.
  clientId?: number;
  onCreated: () => void;
}

const EMPTY = {
  title: "",
  category: "SEO" as SuggestionCategory,
  priority: "Medium" as SuggestionPriority,
  description: "",
  expectedBenefit: "",
  estimatedCost: "",
  estimatedTime: "",
  includedInPlan: false,
};

export default function NewSuggestionForm({ clientId, onCreated }: Props) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (clientId) return;
    let cancelled = false;
    fetchJson<ClientOption[]>("/api/clients").then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        toast.error("Couldn't load the business list — reload and try again.");
      } else {
        setClients(Array.isArray(data) ? data : []);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const targetId = clientId ?? parseInt(selectedClientId);
    if (!targetId) {
      toast.error("Choose a business first");
      return;
    }
    setSubmitting(true);
    try {
      const { ok } = await mutate(
        `/api/clients/${targetId}/suggestions`,
        { method: "POST", body: JSON.stringify(form) },
        { success: "Suggestion posted", error: "Failed to post suggestion" }
      );
      if (ok) {
        setForm(EMPTY);
        setSelectedClientId("");
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      {!clientId && (
        <Select
          required
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          aria-label="Business"
          className="sm:col-span-2"
        >
          <option value="">Choose a business *</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.company || c.name}
            </option>
          ))}
        </Select>
      )}
      <Input
        required
        placeholder="Title *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="sm:col-span-2"
      />
      <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as SuggestionCategory })} aria-label="Category">
        {SUGGESTION_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SuggestionPriority })} aria-label="Priority">
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </Select>
      <Textarea
        placeholder="What do you recommend, and why?"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        rows={2}
        className="sm:col-span-2"
      />
      <Input
        placeholder="Expected benefit (e.g. faster page loads)"
        value={form.expectedBenefit}
        onChange={(e) => setForm({ ...form, expectedBenefit: e.target.value })}
        className="sm:col-span-2"
      />
      <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
        <input
          type="checkbox"
          checked={form.includedInPlan}
          onChange={(e) => setForm({ ...form, includedInPlan: e.target.checked })}
          className="h-4 w-4 accent-amber-500"
        />
        Included in their maintenance plan (no cost)
      </label>
      {!form.includedInPlan && (
        <>
          <Input
            required
            inputMode="decimal"
            placeholder="Price (AUD, ex GST) *"
            value={form.estimatedCost}
            onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
          />
          <Input
            placeholder="Estimated time (e.g. 2 business days)"
            value={form.estimatedTime}
            onChange={(e) => setForm({ ...form, estimatedTime: e.target.value })}
          />
        </>
      )}
      <Button type="submit" loading={submitting} className="sm:col-span-2">
        Post suggestion
      </Button>
    </form>
  );
}
