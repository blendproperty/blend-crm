import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

export default async function PropertiesPage() {
  await requireUser();
  const properties = await db.property.findMany({
    include: { _count: { select: { leads: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <CrmShell title="Properties" eyebrow={`${properties.length} CRM properties`}>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {properties.map((property) => (
          <article key={property.id} className="rounded-xl border border-[#e2e8e5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#168f69]">{property.reference}</p>
                <h2 className="mt-2 font-bold">{property.title}</h2>
                <p className="mt-1 text-sm text-[#74817b]">{property.address ?? "Address not supplied"}</p>
              </div>
              <span className="rounded-full bg-[#e4f5ee] px-2.5 py-1 text-xs font-bold text-[#137052]">{property._count.leads} leads</span>
            </div>
          </article>
        ))}
        {properties.length === 0 && <p className="col-span-full rounded-xl border border-[#e2e8e5] bg-white px-6 py-16 text-center text-sm text-[#74817b]">Properties will be created automatically when listing enquiries arrive.</p>}
      </section>
    </CrmShell>
  );
}
