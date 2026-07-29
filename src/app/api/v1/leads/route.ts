import { timingSafeEqual } from "node:crypto";

import { createLeadFromIntake } from "@/lib/create-lead";
import { leadIntakeSchema } from "@/lib/lead-intake";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = process.env.LEAD_INGEST_API_KEY;
  const provided = request.headers.get("x-crm-api-key");

  if (!expected || !provided) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = leadIntakeSchema.safeParse(json);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid lead", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await createLeadFromIntake(parsed.data);

  return Response.json(
    {
      id: result.lead.id,
      stage: result.lead.stage,
      duplicate: result.duplicate,
    },
    { status: result.duplicate ? 200 : 201 },
  );
}
