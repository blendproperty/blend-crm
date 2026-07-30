import { CrmShell } from "@/components/crm-shell";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";

import { PipelineBoard, type PipelineLead } from "./pipeline-board";

const stages = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATION",
] as const;

export default async function PipelinePage() {
  await requireUser();
  const leads = await db.lead.findMany({
    where: { stage: { in: [...stages] } },
    include: { contact: true, property: true, website: true },
    orderBy: { createdAt: "desc" },
  });

  const pipelineLeads: PipelineLead[] = leads.map((lead) => ({
    id: lead.id,
    stage: lead.stage,
    priority: lead.priority,
    contactName:
      `${lead.contact.firstName} ${lead.contact.lastName ?? ""}`.trim(),
    propertyTitle: lead.property?.title ?? "General enquiry",
    websiteName: lead.website.name,
  }));

  return (
    <CrmShell
      title="Pipeline"
      eyebrow={`${pipelineLeads.length} active opportunities`}
    >
      <PipelineBoard initialLeads={pipelineLeads} />
    </CrmShell>
  );
}
