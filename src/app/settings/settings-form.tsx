"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function SettingsForm({ user }: { user: { name: string; email: string; role: string } }) {
  const router = useRouter();
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputClass = "mt-2 h-11 w-full rounded-lg border border-[#dce4e0] px-3 text-sm outline-none focus:border-[#159a70]";

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setProfileMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email") }) });
    const body = await response.json().catch(() => null);
    if (response.ok) { setProfileMessage("Profile updated."); router.refresh(); }
    else setError(body?.error ?? "Unable to update your profile");
    setSaving(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setPasswordMessage("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (form.get("newPassword") !== form.get("confirmPassword")) { setError("The new passwords do not match"); setSaving(false); return; }
    const response = await fetch("/api/settings/password", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }) });
    const body = await response.json().catch(() => null);
    if (response.ok) { formElement.reset(); setPasswordMessage("Password changed successfully."); }
    else setError(body?.error ?? "Unable to change your password");
    setSaving(false);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 lg:col-span-2">{error}</p>}
      <form onSubmit={updateProfile} className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#071839]">Profile</h2>
        <p className="mt-1 text-sm text-[#66746e]">Update the details shown throughout the CRM.</p>
        <label className="mt-5 block text-sm font-bold">Full name<input className={inputClass} name="name" defaultValue={user.name} required /></label>
        <label className="mt-4 block text-sm font-bold">Email address<input className={inputClass} name="email" type="email" defaultValue={user.email} required /></label>
        <div className="mt-4 rounded-lg bg-[#f4f8f6] px-4 py-3 text-sm"><span className="font-bold">Role:</span> {user.role}</div>
        <button disabled={saving} className="mt-5 rounded-lg bg-[#159a70] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">Save profile</button>
        {profileMessage && <p role="status" className="mt-3 text-sm font-medium text-[#137052]">{profileMessage}</p>}
      </form>
      <form onSubmit={updatePassword} className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-[#071839]">Password</h2>
        <p className="mt-1 text-sm text-[#66746e]">Choose a private password after receiving a temporary one.</p>
        <label className="mt-5 block text-sm font-bold">Current password<input className={inputClass} name="currentPassword" type="password" autoComplete="current-password" required /></label>
        <label className="mt-4 block text-sm font-bold">New password<input className={inputClass} name="newPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
        <label className="mt-4 block text-sm font-bold">Confirm new password<input className={inputClass} name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required /></label>
        <button disabled={saving} className="mt-5 rounded-lg bg-[#159a70] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">Change password</button>
        {passwordMessage && <p role="status" className="mt-3 text-sm font-medium text-[#137052]">{passwordMessage}</p>}
      </form>
    </div>
  );
}
