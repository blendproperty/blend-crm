import { timingSafeEqual } from "node:crypto";

import { createLeadFromIntake } from "@/lib/create-lead";
import { googleAdsLeadSchema, googleAdsLeadToIntake } from "@/lib/google-ads-lead";

export const dynamic = "force-dynamic";

function equalSecret(expected: string | undefined, provided: string | undefined) {
  if (!expected || !provided) return false;
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!equalSecret(process.env.GOOGLE_ADS_WEBHOOK_TOKEN, token)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = googleAdsLeadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ message: "Invalid Google Ads lead" }, { status: 400 });
  }
  if (!equalSecret(process.env.GOOGLE_ADS_WEBHOOK_KEY, parsed.data.google_key)) {
    return Response.json({ message: "Invalid Google key" }, { status: 401 });
  }

  let intake;
  try {
    intake = googleAdsLeadToIntake(parsed.data);
  } catch {
    return Response.json({ message: "Lead must contain an email address or phone number" }, { status: 400 });
  }

  const result = await createLeadFromIntake(intake);
  return Response.json({ id: result.lead.id, duplicate: result.duplicate }, { status: 200 });
}
