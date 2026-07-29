import { timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { createLeadFromIntake } from "@/lib/create-lead";
import { leadIntakeSchema } from "@/lib/lead-intake";

export const dynamic = "force-dynamic";

const MIDPOINT_SITE_ID = "67caa7c310ee043ea9e45267";
const MIDPOINT_BASE_URL = "https://www.mid-point.co.za";

const webhookValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const webflowFormWebhookSchema = z.object({
  triggerType: z.literal("form_submission"),
  payload: z.object({
    id: z.string().trim().min(1).max(160),
    siteId: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(160),
    data: z.record(z.string(), webhookValueSchema),
    submittedAt: z.string().optional(),
    formId: z.string().optional(),
    formElementId: z.string().optional(),
    publishedPath: z.string().optional(),
  }),
});

function isAuthorized(provided: string) {
  const expected = process.env.WEBFLOW_WEBHOOK_TOKEN;

  if (!expected) return false;

  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

function text(data: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function sourcePage(path?: string) {
  if (!path?.startsWith("/")) return MIDPOINT_BASE_URL;

  return new URL(path, MIDPOINT_BASE_URL).toString();
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;

  if (!isAuthorized(token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const webhook = webflowFormWebhookSchema.safeParse(json);

  if (!webhook.success) {
    return Response.json({ error: "Invalid webhook" }, { status: 400 });
  }

  const { payload } = webhook.data;

  if (payload.siteId !== MIDPOINT_SITE_ID || payload.name !== "Email Form") {
    return Response.json({ ignored: true }, { status: 200 });
  }

  const firstName = text(payload.data, "Name", "First Name");
  const lastName = text(payload.data, "Last Name");
  const email = text(payload.data, "Email", "email");
  const phone = text(payload.data, "Phone Number", "Phone");
  const interest = text(payload.data, "Interests", "Interested-in");
  const enquiryMessage = text(payload.data, "Message");
  const message = [
    interest && interest !== "Not Specified"
      ? `Interest: ${interest}`
      : undefined,
    enquiryMessage,
  ]
    .filter(Boolean)
    .join("\n\n");

  const intake = leadIntakeSchema.safeParse({
    source: {
      slug: "midpoint",
      name: "Midpoint",
      domain: "www.mid-point.co.za",
    },
    externalId: payload.id,
    contact: {
      firstName,
      lastName,
      email,
      phone,
    },
    ...(message ? { message } : {}),
    sourcePage: sourcePage(payload.publishedPath),
  });

  if (!intake.success) {
    return Response.json({ error: "Invalid lead data" }, { status: 400 });
  }

  const result = await createLeadFromIntake(intake.data);

  return Response.json(
    {
      id: result.lead.id,
      duplicate: result.duplicate,
    },
    { status: 200 },
  );
}
