"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { mutate } from "@/lib/clientApi";

interface Props {
  onCreated: () => void;
  submitLabel?: string;
}

const EMPTY = { name: "", company: "", contactEmail: "", contactPhone: "" };

// Adds a business (a Client record). Admin-only — POST /api/clients enforces it.
export default function NewClientForm({ onCreated, submitLabel = "Add business" }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    try {
      // mutate toasts the server's error message on failure for us.
      const { ok } = await mutate(
        "/api/clients",
        { method: "POST", body: JSON.stringify(form) },
        { success: "Client onboarded", error: "Failed to add business" }
      );
      if (ok) {
        setForm(EMPTY);
        onCreated();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" className="grid gap-3 sm:grid-cols-2">
      <Input
        required
        aria-label="Business or client name"
        placeholder="Business / client name *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        aria-label="Company legal name"
        placeholder="Company (legal name)"
        value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })}
      />
      <Input
        type="email"
        aria-label="Contact email"
        placeholder="Contact email"
        value={form.contactEmail}
        onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
      />
      <Input
        type="tel"
        aria-label="Contact phone"
        placeholder="Contact phone"
        value={form.contactPhone}
        onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
      />
      <Button
        type="submit"
        variant="success"
        loading={submitting}
        className="w-full sm:w-auto sm:justify-self-start"
      >
        {submitLabel}
      </Button>
    </form>
  );
}
