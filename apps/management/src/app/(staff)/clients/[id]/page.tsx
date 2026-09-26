"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { confirmAction } from "@/components/ui/ConfirmDialog";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { toast } from "@/components/ui/Toaster";
import { useCurrentUser } from "@/components/layout/Shell";
import { fetchJson, mutate, mutateForm } from "@/lib/clientApi";
import NewSuggestionForm from "@/components/NewSuggestionForm";
import PortalAccessPanel from "@/components/PortalAccessPanel";
import Link from "next/link";
import AssigneeSelect from "@/components/ui/AssigneeSelect";
import {
  CLIENT_STAGES,
  CLIENT_STAGE_LABELS,
  CLIENT_STAGE_TONE,
  PAYMENT_STATUS_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  isTaskOpen,
  PROJECT_STATUS_TONE,
  stageIndex,
  formatDate,
  formatFileSize,
  type Client,
  type PaymentStatus,
  type TaskStatus,
  type MoscowPriority,
  type ProjectStatus,
  SERVICE_TYPES,
  SUGGESTION_STATUS_LABELS,
  SUGGESTION_STATUS_TONE,
  formatAUD,
  type Service,
  type ServiceType,
  type Suggestion,
} from "@/types";

const PAYMENT_OPTIONS: PaymentStatus[] = ["NotPaid", "PartiallyPaid", "Paid"];

// Selected payment chip per status — full literal strings so Tailwind's
// static scanner picks them up. Same padding as the unselected state so the
// row never shifts when the selection moves.
const PAYMENT_CHIP_ACTIVE: Record<PaymentStatus, string> = {
  NotPaid: "border-rose-500/50 bg-rose-500/10 text-rose-400",
  PartiallyPaid: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  Paid: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
};

const PRIORITY_BADGE: Record<MoscowPriority, { label: string; tone: string }> = {
  Must: { label: "Must", tone: "rose" },
  Should: { label: "Should", tone: "amber" },
  Could: { label: "Could", tone: "sky" },
  Wont: { label: "Won't", tone: "slate" },
};

// Shared look for the text-style "Remove" actions in list rows.
const ROW_ACTION =
  "rounded text-xs text-slate-500 hover:text-rose-400 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // keep in sync with MAX_DOCUMENT_SIZE server-side

interface ProjectRow {
  id: number;
  name: string;
  status: ProjectStatus;
  milestones: { status: string }[];
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p className="text-xs text-rose-400">
      {message}{" "}
      <button
        type="button"
        onClick={onRetry}
        className="rounded underline text-rose-300 hover:text-rose-200 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
      >
        Retry
      </button>
    </p>
  );
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser, loaded: userLoaded } = useCurrentUser();
  const [client, setClient] = useState<Client | null>(null);
  const clientRef = useRef<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [amountDraft, setAmountDraft] = useState({ amountPaid: "", totalAmount: "" });
  const [reqForm, setReqForm] = useState({ role: "", functionality: "", value: "", priority: "Must" as MoscowPriority });
  const [taskForm, setTaskForm] = useState<{ title: string; assigneeUserId: number | null }>({
    title: "",
    assigneeUserId: null,
  });
  const [patching, setPatching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingReq, setAddingReq] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({ type: "Hosting" as ServiceType, provider: "", planName: "" });
  const [addingService, setAddingService] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);

  const isAdmin = userLoaded && Boolean(currentUser?.isAdmin);

  const load = useCallback(async () => {
    const { data, error, status } = await fetchJson<Client>(`/api/clients/${params.id}`);
    if (error) {
      if (status === 404) {
        setNotFound(true);
      } else if (clientRef.current) {
        // The page is already rendered — surface the refresh failure
        // without blanking everything the user is looking at.
        toast.error(error);
      } else {
        setLoadError(error);
      }
    } else if (data) {
      const isFirstLoad = clientRef.current === null;
      const serverNotesChanged = (clientRef.current?.notes ?? "") !== (data.notes ?? "");
      clientRef.current = data;
      setClient(data);
      // Don't clobber an unsaved notes draft on background refetches.
      if (isFirstLoad || serverNotesChanged) setNotes(data.notes ?? "");
      setNotFound(false);
      setLoadError(null);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the amount inputs in sync with the saved client.
  useEffect(() => {
    if (client) {
      setAmountDraft({ amountPaid: client.amountPaid ?? "", totalAmount: client.totalAmount ?? "" });
    }
  }, [client]);

  const loadProjects = useCallback(async () => {
    const { data, error } = await fetchJson<ProjectRow[]>(`/api/clients/${params.id}/projects`);
    if (error) {
      setProjectsError(error);
    } else {
      setProjectsError(null);
      setProjects(Array.isArray(data) ? data : []);
    }
  }, [params.id]);

  const loadServices = useCallback(async () => {
    const { data, error } = await fetchJson<Service[]>(`/api/clients/${params.id}/services`);
    if (error) {
      setServicesError(error);
    } else {
      setServicesError(null);
      setServices(Array.isArray(data) ? data : []);
    }
  }, [params.id]);

  const loadSuggestions = useCallback(async () => {
    const { data, error } = await fetchJson<Suggestion[]>(`/api/suggestions?clientId=${params.id}`);
    if (error) {
      setSuggestionsError(error);
    } else {
      setSuggestionsError(null);
      setSuggestions(Array.isArray(data) ? data : []);
    }
  }, [params.id]);

  useEffect(() => {
    loadProjects();
    loadServices();
    loadSuggestions();
  }, [loadProjects, loadServices, loadSuggestions]);

  /** PATCH the client and swap in the updated record. Omit `success` for
   *  checkbox-ish toggles; mutate already toasts failures either way. */
  async function patchClient(
    data: Record<string, unknown>,
    opts: { success?: string; error?: string } = {}
  ): Promise<boolean> {
    setPatching(true);
    try {
      const { ok, data: updated } = await mutate<Client>(
        `/api/clients/${params.id}`,
        { method: "PATCH", body: JSON.stringify(data) },
        { error: "Failed to update client", ...opts }
      );
      if (ok && updated) {
        clientRef.current = updated;
        setClient(updated);
      }
      return ok;
    } finally {
      setPatching(false);
    }
  }

  async function handleDelete() {
    const confirmed = await confirmAction({
      title: "Delete this client?",
      message:
        "This permanently removes the client along with their requirements, tasks, projects, invoices, portal users and uploaded files. This cannot be undone.",
      confirmLabel: "Delete client",
      tone: "danger",
    });
    if (!confirmed) return;
    setDeleting(true);
    const { ok } = await mutate(
      `/api/clients/${params.id}`,
      { method: "DELETE" },
      { success: "Client deleted", error: "Failed to delete client" }
    );
    if (ok) {
      router.push("/clients");
    } else {
      setDeleting(false);
    }
  }

  async function saveAmount(field: "amountPaid" | "totalAmount") {
    if (!client) return;
    const raw = amountDraft[field].trim();
    const saved = client[field] ?? "";
    if (raw === saved) return; // unchanged — no PATCH
    if (raw !== "" && Number.isNaN(Number(raw))) {
      toast.error("Amounts must be a number, e.g. 1500 or 1500.50.");
      setAmountDraft((d) => ({ ...d, [field]: saved }));
      return;
    }
    if (raw !== "" && Number(raw) < 0) {
      toast.error("Amounts can't be negative.");
      setAmountDraft((d) => ({ ...d, [field]: saved }));
      return;
    }
    const ok = await patchClient({ [field]: raw }, { success: "Saved" });
    if (ok) {
      const paid = Number(field === "amountPaid" ? raw : client.amountPaid);
      const total = Number(field === "totalAmount" ? raw : client.totalAmount);
      if (!Number.isNaN(paid) && !Number.isNaN(total) && total > 0 && paid > total) {
        toast.info("Amount paid is now more than the total amount.");
      }
    }
  }

  async function saveNotes() {
    if (!client || notes === (client.notes ?? "")) return;
    await patchClient({ notes }, { success: "Notes saved" });
  }

  async function addRequirement(e: React.FormEvent) {
    e.preventDefault();
    if (!reqForm.functionality.trim() || addingReq) return;
    setAddingReq(true);
    try {
      const { ok } = await mutate(
        `/api/clients/${params.id}/requirements`,
        { method: "POST", body: JSON.stringify(reqForm) },
        { success: "Requirement added", error: "Failed to add requirement" }
      );
      if (ok) {
        setReqForm({ role: "", functionality: "", value: "", priority: "Must" });
        load();
      }
    } finally {
      setAddingReq(false);
    }
  }

  async function deleteRequirement(id: number) {
    const confirmed = await confirmAction({
      title: "Remove this requirement?",
      message: "This permanently deletes it from the BRD / PRD list.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/requirements/${id}`,
      { method: "DELETE" },
      { success: "Requirement removed", error: "Failed to remove requirement" }
    );
    if (ok) load();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.title.trim() || addingTask) return;
    setAddingTask(true);
    try {
      const { ok } = await mutate(
        `/api/tasks`,
        { method: "POST", body: JSON.stringify({ clientId: params.id, ...taskForm }) },
        { success: "Task added", error: "Failed to add task" }
      );
      if (ok) {
        setTaskForm({ title: "", assigneeUserId: null });
        load();
      }
    } finally {
      setAddingTask(false);
    }
  }

  // Moving a task between statuses is trivially reversible — no confirm.
  async function setTaskStatus(taskId: number, status: TaskStatus) {
    const { ok } = await mutate(
      `/api/tasks/${taskId}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      { error: "Failed to update task status" }
    );
    if (ok) load();
  }

  async function reassignTask(taskId: number, assigneeUserId: number | null) {
    const { ok } = await mutate(
      `/api/tasks/${taskId}`,
      { method: "PATCH", body: JSON.stringify({ assigneeUserId }) },
      { success: "Assignee updated", error: "Failed to update assignee" }
    );
    if (ok) load();
  }

  async function deleteTask(taskId: number) {
    const confirmed = await confirmAction({
      title: "Remove this task?",
      message: "This permanently deletes the task.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/tasks/${taskId}`,
      { method: "DELETE" },
      { success: "Task removed", error: "Failed to remove task" }
    );
    if (ok) load();
  }

  async function uploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (uploading) return;
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("That file is over the 10 MB limit — please choose a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.set("clientId", String(params.id));
    formData.set("file", file);

    setUploading(true);
    try {
      const { ok } = await mutateForm("/api/documents", formData, {
        success: "Document uploaded",
        error: "Failed to upload document",
      });
      if (ok) {
        form.reset();
        load();
      }
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(id: number) {
    const confirmed = await confirmAction({
      title: "Remove this document?",
      message: "The uploaded file will be permanently deleted.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/documents/${id}`,
      { method: "DELETE" },
      { success: "Document removed", error: "Failed to remove document" }
    );
    if (ok) load();
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim() || creatingProject) return;
    setCreatingProject(true);
    try {
      const { ok } = await mutate(
        `/api/clients/${params.id}/projects`,
        { method: "POST", body: JSON.stringify({ name: newProjectName }) },
        { success: "Project created", error: "Failed to create project" }
      );
      if (ok) {
        setNewProjectName("");
        loadProjects();
      }
    } finally {
      setCreatingProject(false);
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceForm.provider.trim() || addingService) return;
    setAddingService(true);
    try {
      const { ok } = await mutate(
        `/api/clients/${params.id}/services`,
        { method: "POST", body: JSON.stringify(serviceForm) },
        { success: "Service added", error: "Failed to add service" }
      );
      if (ok) {
        setServiceForm({ type: "Hosting", provider: "", planName: "" });
        loadServices();
      }
    } finally {
      setAddingService(false);
    }
  }

  async function removeService(id: number) {
    const confirmed = await confirmAction({
      title: "Remove this service record?",
      message: "The client will no longer see it in their portal.",
      confirmLabel: "Remove",
      tone: "danger",
    });
    if (!confirmed) return;
    const { ok } = await mutate(
      `/api/services/${id}`,
      { method: "DELETE" },
      { success: "Service removed", error: "Failed to remove service" }
    );
    if (ok) loadServices();
  }

  if (loading) {
    return (
      <>
        <p className="text-sm text-slate-400">Loading...</p>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <p className="text-sm text-slate-400">Client not found.</p>
      </>
    );
  }

  if (loadError || !client) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <p className="text-xs text-rose-300">
            {loadError ?? "Something went wrong loading this client."}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              load();
            }}
          >
            Retry
          </Button>
        </div>
      </>
    );
  }

  const currentStageIndex = stageIndex(client.stage);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">Client</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{client.name}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
              {client.company && <span>{client.company}</span>}
              {client.contactEmail && <span>{client.contactEmail}</span>}
              {client.contactPhone && <span>{client.contactPhone}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge label={CLIENT_STAGE_LABELS[client.stage]} tone={CLIENT_STAGE_TONE[client.stage]} />
            {isAdmin && (
              <Button variant="danger" loading={deleting} onClick={handleDelete}>
                Delete client
              </Button>
            )}
          </div>
        </div>

        {/* Lifecycle stepper */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Lifecycle progress</h2>
          <p className="text-xs text-slate-500 mt-1">Click a stage to move the client there.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CLIENT_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <button
                  key={stage}
                  onClick={() => patchClient({ stage }, { success: "Stage updated" })}
                  disabled={isCurrent || patching}
                  aria-pressed={isCurrent}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isCurrent
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                      : isDone
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/60 hover:text-emerald-300"
                      : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span aria-hidden="true">{isDone ? "☑" : isCurrent ? "▶" : "☐"}</span>
                  {CLIENT_STAGE_LABELS[stage]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Payment */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Payment</h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {PAYMENT_OPTIONS.map((status) => {
                const isSelected = client.paymentStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => patchClient({ paymentStatus: status }, { success: "Payment status updated" })}
                    disabled={isSelected || patching}
                    aria-pressed={isSelected}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? PAYMENT_CHIP_ACTIVE[status]
                        : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    {PAYMENT_STATUS_LABELS[status]}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs text-slate-500">
                Amount paid
                <Input
                  inputMode="decimal"
                  value={amountDraft.amountPaid}
                  onChange={(e) => setAmountDraft((d) => ({ ...d, amountPaid: e.target.value }))}
                  onBlur={() => saveAmount("amountPaid")}
                  className="mt-1"
                />
              </label>
              <label className="text-xs text-slate-500">
                Total amount
                <Input
                  inputMode="decimal"
                  value={amountDraft.totalAmount}
                  onChange={(e) => setAmountDraft((d) => ({ ...d, totalAmount: e.target.value }))}
                  onBlur={() => saveAmount("totalAmount")}
                  className="mt-1"
                />
              </label>
            </div>
          </div>

          {/* MVP */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">MVP delivery</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  client.mvpSentAt
                    ? // Un-sending also clears the approval — one atomic PATCH.
                      patchClient({ mvpSentAt: null, mvpApprovedAt: null })
                    : patchClient({ mvpSentAt: new Date().toISOString() })
                }
                disabled={patching}
                aria-pressed={Boolean(client.mvpSentAt)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  client.mvpSentAt
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                    : "border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {client.mvpSentAt ? "☑ MVP sent" : "☐ Mark MVP sent"}
              </button>
              <button
                disabled={!client.mvpSentAt || patching}
                aria-pressed={Boolean(client.mvpApprovedAt)}
                onClick={() =>
                  patchClient({ mvpApprovedAt: client.mvpApprovedAt ? null : new Date().toISOString() })
                }
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  client.mvpApprovedAt
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {client.mvpApprovedAt ? "☑ Client approved MVP" : "☐ Client approved MVP"}
              </button>
            </div>
            {client.mvpSentAt && (
              <p className="mt-3 text-xs text-slate-500">
                Sent {formatDate(client.mvpSentAt)}
                {client.mvpApprovedAt && ` · Approved ${formatDate(client.mvpApprovedAt)}`}
              </p>
            )}
          </div>
        </div>

        {/* Requirements */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Requirements (BRD / PRD)</h2>
          <div className="mt-4 space-y-2">
            {client.requirements.length === 0 && (
              <p className="text-xs text-slate-500">No requirements captured yet.</p>
            )}
            {client.requirements.map((req) => (
              <div
                key={req.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <p className="text-sm text-slate-300">
                  As a <span className="text-slate-100 font-medium">{req.role || "user"}</span>, I want to{" "}
                  <span className="text-slate-100 font-medium">{req.functionality}</span>
                  {req.value && <> so that {req.value}</>}{" "}
                  <Badge
                    label={PRIORITY_BADGE[req.priority].label}
                    tone={PRIORITY_BADGE[req.priority].tone}
                    className="ml-1 align-middle"
                  />
                </p>
                <button onClick={() => deleteRequirement(req.id)} className={ROW_ACTION}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={addRequirement} className="mt-4 grid gap-2 sm:grid-cols-4">
            <Input
              aria-label="Role"
              placeholder="Role (e.g. Customer)"
              value={reqForm.role}
              onChange={(e) => setReqForm({ ...reqForm, role: e.target.value })}
            />
            <Input
              aria-label="Wanted functionality"
              placeholder="Wants to... *"
              value={reqForm.functionality}
              onChange={(e) => setReqForm({ ...reqForm, functionality: e.target.value })}
              className="sm:col-span-2"
            />
            <Select
              aria-label="MoSCoW priority"
              value={reqForm.priority}
              onChange={(e) => setReqForm({ ...reqForm, priority: e.target.value as MoscowPriority })}
            >
              <option value="Must">Must have</option>
              <option value="Should">Should have</option>
              <option value="Could">Could have</option>
              <option value="Wont">Won&apos;t have</option>
            </Select>
            <Input
              aria-label="Value delivered"
              placeholder="So that... (value)"
              value={reqForm.value}
              onChange={(e) => setReqForm({ ...reqForm, value: e.target.value })}
              className="sm:col-span-3"
            />
            <Button type="submit" loading={addingReq}>
              Add
            </Button>
          </form>
        </div>

        {/* Documents */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Documents</h2>
          <div className="mt-4 space-y-2">
            {client.documents.length === 0 && (
              <p className="text-xs text-slate-500">No documents uploaded yet.</p>
            )}
            {client.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="min-w-0">
                  <a
                    href={`/api/documents/${doc.id}`}
                    className="text-sm text-slate-200 hover:text-amber-400 break-all"
                  >
                    📄 {doc.originalName}
                  </a>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(doc.size)} · uploaded by {doc.uploadedBy} on{" "}
                    {formatDate(doc.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className={`${ROW_ACTION} shrink-0`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={uploadDocument} className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="file"
              name="file"
              required
              aria-label="Document file"
              className="flex-1 min-w-50 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-amber-500 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-slate-950"
            />
            <Button type="submit" loading={uploading}>
              Upload
            </Button>
            <span className="text-[11px] text-slate-500">Max 10 MB</span>
          </form>
        </div>

        {/* Tasks */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Task follow-up</h2>
          <div className="mt-4 space-y-2">
            {client.tasks.length === 0 && (
              <p className="text-xs text-slate-500">No tasks yet.</p>
            )}
            {client.tasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`text-sm ${
                      isTaskOpen(task.status) ? "text-slate-200" : "text-slate-500 line-through"
                    }`}
                  >
                    {task.title}
                  </span>
                  {userLoaded &&
                    (isAdmin ? (
                      <AssigneeSelect
                        aria-label={`Assignee for ${task.title}`}
                        value={task.assigneeUserId}
                        onChange={(userId) => reassignTask(task.id, userId)}
                        className="max-w-36"
                      />
                    ) : (
                      <span className="text-xs text-slate-500">· {task.assignee}</span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    aria-label={`Status of "${task.title}"`}
                    value={task.status}
                    onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
                    className="max-w-36"
                  >
                    {TASK_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {TASK_STATUS_LABELS[st]}
                      </option>
                    ))}
                  </Select>
                  <Badge label={TASK_STATUS_LABELS[task.status]} tone={TASK_STATUS_TONE[task.status]} />
                  <button onClick={() => deleteTask(task.id)} className={ROW_ACTION}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={addTask} className="mt-4 flex flex-wrap gap-2">
            <Input
              aria-label="New task title"
              placeholder="New task *"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="flex-1 min-w-50"
            />
            {isAdmin && (
              <AssigneeSelect
                aria-label="Assign to"
                value={taskForm.assigneeUserId}
                onChange={(assigneeUserId) => setTaskForm({ ...taskForm, assigneeUserId })}
                className="max-w-40"
              />
            )}
            <Button type="submit" loading={addingTask}>
              Add task
            </Button>
          </form>
        </div>

        {/* Projects (client portal) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <p className="text-xs text-slate-500 mt-1">Visible to this client in their portal.</p>
          <div className="mt-4 space-y-2">
            {projectsError ? (
              <SectionError message={projectsError} onRetry={loadProjects} />
            ) : (
              <>
                {projects.length === 0 && <p className="text-xs text-slate-500">No projects yet.</p>}
                {projects.map((p) => {
                  const progress = p.milestones.length === 0 ? 0 : Math.round((p.milestones.filter((m) => m.status === "Completed").length / p.milestones.length) * 100);
                  return (
                    <Link
                      key={p.id}
                      href={`/projects/${p.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 hover:border-amber-500/40 transition"
                    >
                      <div>
                        <p className="text-sm text-slate-200">{p.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge label={p.status} tone={PROJECT_STATUS_TONE[p.status]} />
                          <span className="text-xs text-slate-500">{progress}% complete</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
          {isAdmin && (
            <form onSubmit={createProject} className="mt-4 flex gap-2">
              <Input
                aria-label="New project name"
                placeholder="New project name *"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" loading={creatingProject}>
                Create project
              </Button>
            </form>
          )}
        </div>

        {/* Services (domain/hosting/etc.) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Services</h2>
          <p className="text-xs text-slate-500 mt-1">Domain, hosting, SSL, email — visible read-only to this client in their portal.</p>
          <div className="mt-4 space-y-2">
            {servicesError ? (
              <SectionError message={servicesError} onRetry={loadServices} />
            ) : (
              <>
                {services.length === 0 && <p className="text-xs text-slate-500">No services on file yet.</p>}
                {services.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                    <div>
                      <p className="text-sm text-slate-200">
                        {svc.type} — {svc.provider}
                      </p>
                      {svc.planName && <p className="text-xs text-slate-500">{svc.planName}</p>}
                    </div>
                    {isAdmin && (
                      <button onClick={() => removeService(svc.id)} className={ROW_ACTION}>
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
          {isAdmin && (
            <form onSubmit={addService} className="mt-4 flex flex-wrap gap-2">
              <Select
                aria-label="Service type"
                value={serviceForm.type}
                onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value as ServiceType })}
                className="max-w-36"
              >
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Input
                aria-label="Provider"
                placeholder="Provider (e.g. AWS, Vercel) *"
                value={serviceForm.provider}
                onChange={(e) => setServiceForm({ ...serviceForm, provider: e.target.value })}
                className="flex-1 min-w-40"
              />
              <Input
                aria-label="Plan name"
                placeholder="Plan (optional)"
                value={serviceForm.planName}
                onChange={(e) => setServiceForm({ ...serviceForm, planName: e.target.value })}
                className="flex-1 min-w-35"
              />
              <Button type="submit" loading={addingService}>
                Add service
              </Button>
            </form>
          )}
        </div>

        {/* Suggestions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Suggestions</h2>
          <p className="text-xs text-slate-500 mt-1">Recommendations for the client to approve, snooze, or decline.</p>
          <div className="mt-4 space-y-2">
            {suggestionsError ? (
              <SectionError message={suggestionsError} onRetry={loadSuggestions} />
            ) : (
              <>
                {suggestions.length === 0 && <p className="text-xs text-slate-500">No suggestions posted yet.</p>}
                {suggestions.map((sug) => (
                  <Link
                    key={sug.id}
                    href={`/suggestions/${sug.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 hover:border-amber-500/40 transition"
                  >
                    <div>
                      <p className="text-sm text-slate-200">{sug.title}</p>
                      <p className="text-xs text-slate-500">
                        {sug.category} · {sug.includedInPlan ? "Included in plan" : sug.estimatedCost ? formatAUD(sug.estimatedCost) : "No cost set"}
                      </p>
                    </div>
                    <Badge label={SUGGESTION_STATUS_LABELS[sug.status]} tone={SUGGESTION_STATUS_TONE[sug.status]} />
                  </Link>
                ))}
              </>
            )}
          </div>
          {isAdmin && (
            <div className="mt-4">
              <NewSuggestionForm clientId={Number(params.id)} onCreated={loadSuggestions} />
            </div>
          )}
        </div>

        {/* Portal Access */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Portal Access</h2>
          <p className="mb-4 mt-1 text-xs text-slate-500">Business contacts who can log in to this client&apos;s portal.</p>
          <PortalAccessPanel clientId={Number(params.id)} isAdmin={isAdmin} />
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Notes</h2>
          <Textarea
            aria-label="Client notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            rows={3}
            className="mt-3"
          />
        </div>
      </div>
    </>
  );
}
