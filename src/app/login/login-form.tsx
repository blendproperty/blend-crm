"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (response.ok) {
      router.replace("/");
      router.refresh();
      return;
    }

    const body = await response.json().catch(() => null);
    setError(body?.error ?? "Unable to sign in");
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#34443d]">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          className="h-12 w-full rounded-lg border border-[#d9e1dd] bg-white px-4 text-sm outline-none transition focus:border-[#159a70] focus:ring-3 focus:ring-[#159a70]/10"
          placeholder="you@blendproperty.co.za"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#34443d]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-lg border border-[#d9e1dd] bg-white px-4 text-sm outline-none transition focus:border-[#159a70] focus:ring-3 focus:ring-[#159a70]/10"
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="h-12 w-full rounded-lg bg-[#159a70] text-sm font-bold text-white shadow-sm transition hover:bg-[#11835f] disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
