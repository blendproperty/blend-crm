import type { ReactNode } from "react";
import Link from "next/link";

import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

const navigation = [
  { label: "Overview", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Properties", href: "/properties" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
  { label: "Team", href: "/users" },
];

export async function CrmShell({
  title,
  eyebrow = "Blend Property Group",
  actions,
  children,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [user, newLeadCount] = await Promise.all([
    requireUser(),
    db.lead.count({ where: { stage: "NEW" } }),
  ]);

  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#17211d]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#102d23] text-white lg:flex">
        <div className="border-b border-white/10 px-7 py-7">
          <p className="text-xl font-bold">BLEND</p>
          <p className="text-[10px] font-semibold tracking-[0.23em] text-emerald-100/65">
            PROPERTY GROUP
          </p>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-emerald-50/65 hover:bg-white/8 hover:text-white"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-current/30 text-[10px]">
                {item.label[0]}
              </span>
              {item.label}
              {item.label === "Leads" && (
                <span className="ml-auto rounded-full bg-[#2fd39b] px-2 py-0.5 text-[10px] font-bold text-[#102d23]">
                  {newLeadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="rounded-lg px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-emerald-100/50">{user.email}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="mt-2 w-full rounded-lg border border-white/15 px-3 py-2 text-left text-xs font-semibold text-emerald-50/70 hover:bg-white/8 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="flex min-h-20 items-center justify-between gap-4 border-b border-[#e1e7e4] bg-white px-5 md:px-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7b75]">
              {eyebrow}
            </p>
            <h1 className="mt-1 text-2xl font-bold">{title}</h1>
          </div>
          {actions}
        </header>
        <main className="mx-auto max-w-[1500px] p-5 md:p-9">{children}</main>
      </div>
    </div>
  );
}
