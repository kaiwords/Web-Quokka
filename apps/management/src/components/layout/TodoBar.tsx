"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import { fetchJson, mutate } from "@/lib/clientApi";
import { confirmAction } from "@/components/ui/ConfirmDialog";

interface Todo {
  id: number;
  title: string;
  done: boolean;
}

// A personal, private to-do widget any logged-in user can open from the top
// bar — separate from a client's shared Task follow-up list.
export default function TodoBar() {
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [adding, setAdding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // True while a confirm dialog is up — its buttons live outside this
  // container, and clicking them shouldn't count as an outside click.
  const confirmingRef = useRef(false);

  async function load() {
    const res = await fetchJson<Todo[]>("/api/todos");
    if (res.error) {
      setLoadError(true);
    } else {
      setLoadError(false);
      setTodos(Array.isArray(res.data) ? res.data : []);
    }
    setLoaded(true);
  }

  useEffect(() => {
    load();
  }, []);

  // Close on outside click or Escape (mouse-leave alone strands the popover
  // open on touch devices and keyboard navigation) — same pattern as the
  // Shell's account menu.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (confirmingRef.current) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    const { ok } = await mutate("/api/todos", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
    setAdding(false);
    if (ok) {
      setTitle("");
      load();
    }
  }

  async function toggleDone(id: number, done: boolean) {
    const { ok } = await mutate(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ done }),
    });
    if (ok) load();
  }

  async function removeTodo(todo: Todo) {
    confirmingRef.current = true;
    const confirmed = await confirmAction({
      title: "Delete this to-do?",
      message: `"${todo.title}" will be permanently removed.`,
      confirmLabel: "Delete",
      tone: "danger",
    });
    confirmingRef.current = false;
    if (!confirmed) return;
    const { ok } = await mutate(`/api/todos/${todo.id}`, { method: "DELETE" });
    if (ok) load();
  }

  const openCount = todos.filter((t) => !t.done).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="My to-do list"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 hover:border-amber-500/40 transition"
      >
        <span className="text-sm leading-none">📝</span>
        {loaded && openCount > 0 && (
          <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded-full text-[10px]">
            {openCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-slate-800 bg-slate-900 shadow-lg shadow-slate-950/40 text-sm z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800">
            <p className="text-xs font-bold text-slate-200">My to-do list</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-xs text-slate-500 hover:text-slate-200 transition"
            >
              ✕
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {!loaded ? (
              <p className="px-2 py-2 text-xs text-slate-500">Loading...</p>
            ) : loadError ? (
              <p className="px-2 py-2 text-xs text-slate-500">
                Couldn&apos;t load your to-dos.{" "}
                <button onClick={load} className="text-amber-400 hover:text-amber-300 underline">
                  Retry
                </button>
              </p>
            ) : todos.length === 0 ? (
              <p className="px-2 py-2 text-xs text-slate-500">Nothing on your list yet.</p>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-800/60"
                >
                  <label className="flex flex-1 items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={(e) => toggleDone(todo.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-amber-500"
                    />
                    <span
                      className={`flex-1 text-xs ${todo.done ? "text-slate-500 line-through" : "text-slate-200"}`}
                    >
                      {todo.title}
                    </span>
                  </label>
                  <button
                    onClick={() => removeTodo(todo)}
                    aria-label={`Delete to-do "${todo.title}"`}
                    className="text-[10px] text-slate-600 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <form onSubmit={addTodo} className="flex items-center gap-2 border-t border-slate-800 p-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a to-do..."
              className="flex-1 rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            />
            <Button type="submit" loading={adding}>
              Add
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
