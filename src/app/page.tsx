const stats = [
  { label: "New leads", value: "24", detail: "+18% this week", tone: "green" },
  { label: "Awaiting response", value: "7", detail: "2 need attention", tone: "orange" },
  { label: "Viewings booked", value: "11", detail: "Next 7 days", tone: "blue" },
  { label: "Conversion rate", value: "18.4%", detail: "+2.1% this month", tone: "purple" },
];

const leads = [
  { name: "Thandi Mokoena", property: "Midpoint · Unit 14", source: "Blend Listings", status: "New", time: "4 min ago", initials: "TM" },
  { name: "Michael Jacobs", property: "OnPoint · Block B", source: "OnPoint Offices", status: "Contacted", time: "28 min ago", initials: "MJ" },
  { name: "Ayanda Nkosi", property: "Commercial enquiry", source: "Blend Property", status: "Qualified", time: "1 hr ago", initials: "AN" },
  { name: "Sarah van Wyk", property: "Sunbird Road", source: "Blend Listings", status: "Viewing", time: "2 hrs ago", initials: "SV" },
];

const sources = [
  { name: "Blend Listings", leads: 84, share: 52, color: "#17956f" },
  { name: "OnPoint Offices", leads: 41, share: 25, color: "#224997" },
  { name: "Blend Property", leads: 24, share: 15, color: "#e8a23c" },
  { name: "Other sources", leads: 13, share: 8, color: "#8a94a3" },
];

const nav = ["Overview", "Leads", "Pipeline", "Properties", "Tasks", "Reports"];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f7f6] text-[#17211d]">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#102d23] text-white lg:flex">
        <div className="border-b border-white/10 px-7 py-7">
          <p className="text-xl font-bold tracking-tight">BLEND</p>
          <p className="mt-0.5 text-[10px] font-semibold tracking-[0.23em] text-emerald-100/65">PROPERTY GROUP</p>
        </div>
        <nav className="flex-1 space-y-1 px-4 py-6">
          {nav.map((item, index) => (
            <a
              key={item}
              href="#"
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                index === 0 ? "bg-white/12 text-white" : "text-emerald-50/65 hover:bg-white/7 hover:text-white"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-current/30 text-[10px]">{item[0]}</span>
              {item}
              {item === "Leads" && <span className="ml-auto rounded-full bg-[#2fd39b] px-2 py-0.5 text-[10px] font-bold text-[#102d23]">24</span>}
            </a>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-lg p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d9efe7] text-xs font-bold text-[#14563f]">BD</span>
            <div>
              <p className="text-sm font-semibold">Brett Dovey</p>
              <p className="text-xs text-emerald-100/55">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-[#e1e7e4] bg-white/95 px-5 backdrop-blur md:px-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7b75]">Wednesday, 29 July</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight md:text-2xl">Good morning, Brett</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg border border-[#dfe5e2] bg-white px-4 py-2.5 text-sm font-semibold text-[#34443d] shadow-sm sm:block">Import leads</button>
            <button className="rounded-lg bg-[#159a70] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10">+ Add lead</button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] p-5 md:p-9">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-xl border border-[#e2e8e5] bg-white p-5 shadow-[0_2px_12px_rgba(20,45,35,0.04)]">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-[#6f7d77]">{stat.label}</p>
                  <span className={`h-2.5 w-2.5 rounded-full dot-${stat.tone}`} />
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="mt-2 text-xs font-medium text-[#78867f]">{stat.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.65fr_1fr]">
            <article className="overflow-hidden rounded-xl border border-[#e2e8e5] bg-white shadow-[0_2px_12px_rgba(20,45,35,0.04)]">
              <div className="flex items-center justify-between border-b border-[#edf0ef] px-5 py-5 md:px-6">
                <div>
                  <h2 className="font-bold">Recent leads</h2>
                  <p className="mt-1 text-xs text-[#75827c]">Latest enquiries across your websites</p>
                </div>
                <a href="#" className="text-sm font-semibold text-[#168f69]">View all →</a>
              </div>
              <div className="divide-y divide-[#edf0ef]">
                {leads.map((lead) => (
                  <div key={lead.name} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 md:grid-cols-[auto_1.3fr_1fr_auto_auto] md:px-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4f2ed] text-xs font-bold text-[#176b50]">{lead.initials}</span>
                    <div>
                      <p className="text-sm font-bold">{lead.name}</p>
                      <p className="mt-0.5 text-xs text-[#7a8781]">{lead.property}</p>
                    </div>
                    <p className="hidden text-xs font-medium text-[#596760] md:block">{lead.source}</p>
                    <span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold md:inline-block status-${lead.status.toLowerCase()}`}>{lead.status}</span>
                    <p className="text-right text-[11px] text-[#8a958f]">{lead.time}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-xl border border-[#e2e8e5] bg-white p-6 shadow-[0_2px_12px_rgba(20,45,35,0.04)]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold">Lead sources</h2>
                  <p className="mt-1 text-xs text-[#75827c]">Last 30 days</p>
                </div>
                <p className="text-2xl font-bold">162</p>
              </div>
              <div className="mt-8 space-y-5">
                {sources.map((source) => (
                  <div key={source.name}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">{source.name}</span>
                      <span className="font-bold">{source.leads}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#edf1ef]">
                      <div className="h-full rounded-full" style={{ width: `${source.share}%`, backgroundColor: source.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <article className="rounded-xl border border-[#e2e8e5] bg-white p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold">Pipeline overview</h2>
                  <p className="mt-1 text-xs text-[#75827c]">Active leads by stage</p>
                </div>
                <span className="text-sm font-bold text-[#168f69]">R4.2m potential</span>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  ["New", "24", "R840k"],
                  ["Contacted", "18", "R1.1m"],
                  ["Qualified", "12", "R960k"],
                  ["Viewing", "8", "R780k"],
                  ["Negotiation", "5", "R520k"],
                ].map(([stage, count, value], index) => (
                  <div key={stage} className="rounded-lg bg-[#f6f8f7] p-4">
                    <div className="mb-3 h-1 rounded-full bg-[#dfe8e4]"><div className="h-1 rounded-full bg-[#159a70]" style={{ width: `${100 - index * 14}%` }} /></div>
                    <p className="text-xs font-semibold text-[#74817b]">{stage}</p>
                    <p className="mt-1 text-xl font-bold">{count}</p>
                    <p className="mt-1 text-[11px] text-[#89938f]">{value}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-xl bg-[#173e31] p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/65">Needs attention</p>
              <p className="mt-4 text-3xl font-bold">2 leads</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50/65">Have not received a response within your 30-minute target.</p>
              <button className="mt-6 w-full rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#173e31]">Review now</button>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
