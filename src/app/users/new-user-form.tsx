"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { generateTemporaryPassword } from "@/lib/temporary-password";

export function NewUserForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
        role: data.get("role"),
      }),
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      form.reset();
      setPassword("");
      router.refresh();
    } else {
      setError(body?.error ?? "Unable to add the team member");
    }
    setSaving(false);
  }

  const inputClass = "h-11 rounded-lg border border-[#dce4e0] px-3 text-sm outline-none focus:border-[#159a70]";

  function generatePassword() {
    setPassword(generateTemporaryPassword());
  }

  async function copyPassword() {
    if (password) await navigator.clipboard.writeText(password);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-xl border border-[#e2e8e5] bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1.4fr_160px_auto]">
      <input className={inputClass} name="name" placeholder="Full name" required />
      <input className={inputClass} name="email" type="email" placeholder="Email address" required />
      <div className="flex gap-2">
        <input className={`${inputClass} min-w-0 flex-1 font-mono`} name="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={10} placeholder="Temporary password" required />
        <button type="button" onClick={generatePassword} className="rounded-lg border border-[#159a70] px-3 text-xs font-bold text-[#137052]">Generate</button>
        <button type="button" onClick={copyPassword} disabled={!password} className="rounded-lg border border-[#dce4e0] px-3 text-xs font-bold disabled:opacity-40">Copy</button>
      </div>
      <select className={`${inputClass} bg-white`} name="role" defaultValue="AGENT">
        <option value="AGENT">Agent</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Administrator</option>
      </select>
      <button disabled={saving} className="h-11 rounded-lg bg-[#159a70] px-5 text-sm font-bold text-white disabled:opacity-60">
        {saving ? "Adding..." : "Add user"}
      </button>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2 xl:col-span-5">{error}</p>}
    </form>
  );
}
