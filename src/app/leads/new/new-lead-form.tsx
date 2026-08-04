"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { PropertyPicker } from "@/app/leads/new/property-picker";

type WebsiteOption = { id: string; name: string };

export function NewLeadForm({ websites }: { websites: WebsiteOption[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState({ reference: "", title: "" });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();

    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: value("firstName"),
        lastName: value("lastName") || undefined,
        email: value("email") || undefined,
        phone: value("phone") || undefined,
        company: value("company") || undefined,
        websiteId: value("websiteId") || undefined,
        propertyReference: property.reference || undefined,
        propertyTitle: property.title || undefined,
        message: value("message") || undefined,
        priority: value("priority"),
      }),
    });
    const body = await response.json().catch(() => null);

    if (response.ok && body?.id) {
      router.push(`/leads/${body.id}`);
      router.refresh();
      return;
    }

    setError(body?.error ?? "Unable to create the lead");
    setSaving(false);
  }

  const inputClass =
    "h-11 w-full rounded-lg border border-[#dce4e0] px-4 text-sm outline-none focus:border-[#159a70]";

  return (
    <form onSubmit={submit} className="space-y-7 rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm md:p-8">
      <section>
        <h2 className="font-bold">Contact details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input className={inputClass} name="firstName" placeholder="First name *" required />
          <input className={inputClass} name="lastName" placeholder="Last name" />
          <input className={inputClass} name="email" type="email" placeholder="Email address" />
          <input className={inputClass} name="phone" placeholder="Phone number" />
          <input className={`${inputClass} md:col-span-2`} name="company" placeholder="Company" />
        </div>
      </section>
      <section>
        <h2 className="font-bold">Enquiry</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select className={`${inputClass} bg-white`} name="websiteId" defaultValue="">
            <option value="">Source: Manual entry</option>
            {websites.map((website) => (
              <option key={website.id} value={website.id}>
                Source: {website.name}
              </option>
            ))}
          </select>
          <select className={`${inputClass} bg-white`} name="priority" defaultValue="NORMAL">
            <option value="LOW">Low priority</option>
            <option value="NORMAL">Normal priority</option>
            <option value="HIGH">High priority</option>
            <option value="URGENT">Urgent</option>
          </select>
          <PropertyPicker
            reference={property.reference}
            title={property.title}
            onChange={setProperty}
          />
          <textarea
            className="min-h-32 rounded-lg border border-[#dce4e0] px-4 py-3 text-sm outline-none focus:border-[#159a70] md:col-span-2"
            name="message"
            placeholder="Enquiry notes"
          />
        </div>
      </section>
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="flex justify-end">
        <button disabled={saving} className="rounded-lg bg-[#159a70] px-6 py-3 text-sm font-bold text-white disabled:opacity-60">
          {saving ? "Creating..." : "Create lead"}
        </button>
      </div>
    </form>
  );
}
