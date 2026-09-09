"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type TaskItem = {
  id: string;
  type: string;
  title: string;
  status: string;
  dueAt: string | null;
};

export function TaskControls({
  leadId,
  tasks,
  users,
}: {
  leadId: string;
  tasks: TaskItem[];
  users: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [taskType, setTaskType] = useState("GENERAL");

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const due = String(data.get("dueAt") ?? "");
    const response = await fetch(`/api/leads/${leadId}/tasks`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: taskType,
        title: data.get("title"),
        assigneeId: data.get("assigneeId") || undefined,
        dueAt: due ? new Date(due).toISOString() : undefined,
      }),
    });
    if (response.ok) {
      form.reset();
      setTaskType("GENERAL");
      router.refresh();
    } else {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Unable to create the task");
    }
    setSaving(false);
  }

  async function completeTask(id: string) {
    setSaving(true);
    const response = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    if (response.ok) router.refresh();
    else setError("Unable to complete the task");
    setSaving(false);
  }

  return (
    <div>
      <form onSubmit={addTask} className="space-y-3">
        <select
          name="type"
          value={taskType}
          onChange={(event) => setTaskType(event.target.value)}
          className="h-10 w-full rounded-lg border border-[#dce4e0] bg-white px-3 text-sm"
        >
          <option value="GENERAL">General task</option>
          <option value="CALLBACK">Call-back follow-up</option>
        </select>
        <input name="title" required placeholder="Task title" className="h-10 w-full rounded-lg border border-[#dce4e0] px-3 text-sm" />
        <input
          name="dueAt"
          type="datetime-local"
          required={taskType === "CALLBACK"}
          aria-label={taskType === "CALLBACK" ? "Required call-back date and time" : "Optional due date and time"}
          className="h-10 w-full rounded-lg border border-[#dce4e0] px-3 text-sm"
        />
        {taskType === "CALLBACK" && <p className="text-xs font-semibold text-[#168f69]">A date and time are required. The assignee will receive an email reminder.</p>}
        <select name="assigneeId" className="h-10 w-full rounded-lg border border-[#dce4e0] bg-white px-3 text-sm">
          <option value="">Assign to me</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <button disabled={saving} className="w-full rounded-lg bg-[#173e31] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">Add task</button>
      </form>
      <div className="mt-5 space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-lg bg-[#f6f8f7] p-3">
            {task.type === "CALLBACK" && <span className="mb-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">Call-back</span>}
            <p className={`text-sm font-semibold ${task.status === "COMPLETED" ? "line-through opacity-50" : ""}`}>{task.title}</p>
            {task.dueAt && <p className="mt-1 text-[11px] text-[#78857f]">{new Date(task.dueAt).toLocaleString("en-ZA")}</p>}
            {task.status === "OPEN" && <button type="button" disabled={saving} onClick={() => completeTask(task.id)} className="mt-2 text-xs font-bold text-[#168f69]">Mark complete</button>}
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-red-700">{error}</p>}
    </div>
  );
}
