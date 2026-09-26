"use client";

import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Field";
import { fetchJson } from "@/lib/clientApi";

interface StaffUser {
  id: number;
  username: string;
  role: string;
}

// Assignable staff accounts. /api/users is admin-only and this picker only
// renders for admins, so one fetch is shared by every mounted instance
// instead of each row on a list hitting the endpoint separately.
let cache: StaffUser[] | null = null;
let inFlight: Promise<StaffUser[]> | null = null;

async function loadUsers(): Promise<StaffUser[]> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = fetchJson<StaffUser[]>("/api/users")
      .then((res) => {
        cache = Array.isArray(res.data) ? res.data : [];
        return cache;
      })
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
}

interface AssigneeSelectProps {
  /** Currently assigned account, or null when unassigned. */
  value: number | null;
  onChange: (userId: number | null) => void;
  "aria-label": string;
  className?: string;
  disabled?: boolean;
}

// Picks a real account to assign work to. Only accounts can be chosen —
// assignment drives notifications, and a typed-in name is nobody to notify.
export default function AssigneeSelect({
  value,
  onChange,
  className = "",
  disabled,
  ...rest
}: AssigneeSelectProps) {
  const [users, setUsers] = useState<StaffUser[]>(cache ?? []);

  useEffect(() => {
    let cancelled = false;
    loadUsers().then((list) => {
      if (!cancelled) setUsers(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Select
      aria-label={rest["aria-label"]}
      className={className}
      disabled={disabled}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    >
      <option value="">Unassigned</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.username}
          {u.role && u.role !== "User" ? ` — ${u.role}` : ""}
        </option>
      ))}
    </Select>
  );
}
