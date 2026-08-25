import Link from "next/link";

import { db } from "@/lib/db";
import { leadStageBadgeClass, leadStageLabel } from "@/lib/lead-stage";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const nav = [
  { label: "Overview", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Pipeline", href: "/pipeline" },
  { label: "Properties", href: "/properties" },
  { label: "Tasks", href: "/tasks" },
  { label: "Reports", href: "/reports" },
  { label: "Team", href: "/users" },
];
const sourceColors = ["#17956f", "#224997", "#e8a23c", "#8a94a3"];
const pipelineStages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATION",
] as const;

function relativeTime(date: Date) {
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

async function getDashboardData() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const responseTarget = new Date(Date.now() - 30 * 60 * 1000);

  const [
    totalLeads,
    newLeads,
    overdueLeads,
    viewingLeads,
    wonLeads,
    recentLeads,
    sourceGroups,
    stageGroups,
  ] = await Promise.all([
    db.lead.count(),
    db.lead.count({ where: { stage: "NEW" } }),
    db.lead.count({
      where: {
        stage: "NEW",
        firstRespondedAt: null,
        createdAt: { lt: responseTarget },
      },
    }),
    db.lead.count({ where: { stage: "VIEWING" } }),
    db.lead.count({ where: { stage: "WON", closedAt: { gte: thirtyDaysAgo } } }),
    db.lead.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { contact: true, website: true, property: true },
    }),
    db.lead.groupBy({
      by: ["websiteId"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
    }),
    db.lead.groupBy({
      by: ["stage"],
      _count: { _all: true },
    }),
  ]);

  const sourceWebsites = await db.website.findMany({
    where: { id: { in: sourceGroups.map((group) => group.websiteId) } },
  });
  const websiteNames = new Map(
    sourceWebsites.map((website) => [website.id, website.name]),
  );
  const sourceTotal = sourceGroups.reduce(
    (total, group) => total + group._count._all,
    0,
  );
  const stageCounts = new Map(
    stageGroups.map((group) => [group.stage, group._count._all]),
  );

  return {
    totalLeads,
    newLeads,
    overdueLeads,
    viewingLeads,
    conversionRate: totalLeads
      ? Math.round((wonLeads / totalLeads) * 1000) / 10
      : 0,
    recentLeads,
    sources: sourceGroups
      .map((group, index) => ({
        name: websiteNames.get(group.websiteId) ?? "Unknown source",
        leads: group._count._all,
        share: sourceTotal
          ? Math.round((group._count._all / sourceTotal) * 100)
          : 0,
        color: sourceColors[index % sourceColors.length],
      }))
      .sort((left, right) => right.leads - left.leads),
    pipeline: pipelineStages.map((stage) => ({
      stage,
      count: stageCounts.get(stage) ?? 0,
    })),
  };
}

export default async function Home() {
  const [dashboard, user] = await Promise.all([
    getDashboardData(),
    requireUser(),
  ]);
  const stats = [
    {
      label: "New leads",
      value: dashboard.newLeads,
      detail: `${dashboard.totalLeads} total leads`,
      color: "#20b886",
    },
    {
      label: "Awaiting response",
      value: dashboard.overdueLeads,
      detail: "Over the 30-minute target",
      color: "#e7a43f",
    },
    {
      label: "Viewings",
      value: dashboard.viewingLeads,
      detail: "Active viewing-stage leads",
      color: "#477fd1",
    },
    {
      label: "Conversion rate",
      value: `${dashboard.conversionRate}%`,
      detail: "Won in the last 30 days",
      color: "#8b66c6",
    },
  ];

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
          {nav.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                index === 0
                  ? "bg-white/12"
                  : "text-emerald-50/65 hover:bg-white/7 hover:text-white"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-current/30 text-[10px]">
                {item.label[0]}
              </span>
              {item.label}
              {item.label === "Leads" && (
                <span className="ml-auto rounded-full bg-[#2fd39b] px-2 py-0.5 text-[10px] font-bold text-[#102d23]">
                  {dashboard.newLeads}
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
        <header className="flex min-h-20 items-center justify-between border-b border-[#e1e7e4] bg-white px-5 md:px-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7b75]">
              Blend Property Group
            </p>
            <h1 className="mt-1 text-2xl font-bold">CRM Overview</h1>
          </div>
          <Link href="/leads/new" className="rounded-lg bg-[#159a70] px-4 py-2.5 text-sm font-bold text-white">
            + Add lead
          </Link>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 md:p-9">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-xl border border-[#e2e8e5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#6f7d77]">{stat.label}</p>
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stat.color }}
                  />
                </div>
                <p className="mt-3 text-3xl font-bold">{stat.value}</p>
                <p className="mt-2 text-xs text-[#78867f]">{stat.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <article className="overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-sm">
              <div className="border-b border-[#edf0ef] px-6 py-5">
                <h2 className="font-bold">Recent leads</h2>
                <p className="mt-1 text-xs text-[#75827c]">
                  Latest enquiries across connected websites
                </p>
              </div>
              <div className="divide-y divide-[#edf0ef]">
                {dashboard.recentLeads.map((lead) => {
                  const name =
                    `${lead.contact.firstName} ${lead.contact.lastName ?? ""}`.trim();
                  const initials =
                    `${lead.contact.firstName[0] ?? ""}${lead.contact.lastName?.[0] ?? ""}`.toUpperCase();
                  return (
                    <div
                      key={lead.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-6 py-4 md:grid-cols-[auto_1.3fr_1fr_auto_auto]"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f2ed] text-xs font-bold text-[#176b50]">
                        {initials}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{name}</p>
                        <p className="text-xs text-[#7a8781]">
                          {lead.property?.title ?? "General enquiry"}
                        </p>
                      </div>
                      <p className="hidden text-xs font-medium md:block">
                        {lead.website.name}
                      </p>
                      <span className={`hidden rounded-full border px-2.5 py-1 text-[11px] font-bold md:inline-block ${leadStageBadgeClass(lead.stage)}`}>
                        {leadStageLabel(lead.stage)}
                      </span>
                      <p className="text-right text-[11px] text-[#8a958f]">
                        {relativeTime(lead.createdAt)}
                      </p>
                    </div>
                  );
                })}
                {dashboard.recentLeads.length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm font-semibold">No leads received yet</p>
                    <p className="mt-1 text-xs text-[#7a8781]">
                      Website enquiries will appear here automatically.
                    </p>
                  </div>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
              <h2 className="font-bold">Lead sources</h2>
              <p className="mt-1 text-xs text-[#75827c]">Last 30 days</p>
              <div className="mt-7 space-y-5">
                {dashboard.sources.map((source) => (
                  <div key={source.name}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">{source.name}</span>
                      <span className="font-bold">{source.leads}</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#edf1ef]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${source.share}%`,
                          backgroundColor: source.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
                {dashboard.sources.length === 0 && (
                  <p className="rounded-lg bg-[#f6f8f7] px-4 py-6 text-center text-sm text-[#75827c]">
                    No source activity yet.
                  </p>
                )}
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-sm">
            <h2 className="font-bold">Pipeline overview</h2>
            <p className="mt-1 text-xs text-[#75827c]">Active leads by stage</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {dashboard.pipeline.map(({ stage, count }, index) => (
                <div key={stage} className="rounded-lg bg-[#f6f8f7] p-4">
                  <div className="mb-3 h-1 rounded-full bg-[#dfe8e4]">
                    <div
                      className="h-1 rounded-full bg-[#159a70]"
                      style={{ width: `${100 - index * 14}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#74817b]">
                    {stage.charAt(0) + stage.slice(1).toLowerCase()}
                  </p>
                  <p className="mt-1 text-xl font-bold">{count}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
