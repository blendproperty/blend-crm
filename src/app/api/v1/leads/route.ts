import { timingSafeEqual } from "node:crypto";

import { db } from "@/lib/db";
import {
  leadIntakeSchema,
  normalizeEmail,
  normalizePhone,
} from "@/lib/lead-intake";

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

  const input = parsed.data;
  const normalizedEmail = normalizeEmail(input.contact.email);
  const normalizedPhone = normalizePhone(input.contact.phone);

  const result = await db.$transaction(async (transaction) => {
    const website = await transaction.website.upsert({
      where: { slug: input.source.slug },
      update: {
        name: input.source.name,
        domain: input.source.domain,
        active: true,
      },
      create: {
        slug: input.source.slug,
        name: input.source.name,
        domain: input.source.domain,
      },
    });

    if (input.externalId) {
      const existingLead = await transaction.lead.findUnique({
        where: {
          websiteId_externalId: {
            websiteId: website.id,
            externalId: input.externalId,
          },
        },
      });

      if (existingLead) {
        return { lead: existingLead, duplicate: true };
      }
    }

    const contactConditions = [
      ...(normalizedEmail ? [{ normalizedEmail }] : []),
      ...(normalizedPhone ? [{ normalizedPhone }] : []),
    ];

    const existingContact = contactConditions.length
      ? await transaction.contact.findFirst({
          where: { OR: contactConditions },
        })
      : null;

    const contact = existingContact
      ? await transaction.contact.update({
          where: { id: existingContact.id },
          data: {
            firstName: input.contact.firstName,
            lastName: input.contact.lastName,
            email: input.contact.email,
            normalizedEmail,
            phone: input.contact.phone,
            normalizedPhone,
            company: input.contact.company,
          },
        })
      : await transaction.contact.create({
          data: {
            firstName: input.contact.firstName,
            lastName: input.contact.lastName,
            email: input.contact.email,
            normalizedEmail,
            phone: input.contact.phone,
            normalizedPhone,
            company: input.contact.company,
          },
        });

    const property = input.property
      ? await transaction.property.upsert({
          where: { reference: input.property.reference },
          update: {
            title: input.property.title,
            address: input.property.address,
            active: true,
          },
          create: input.property,
        })
      : null;

    const lead = await transaction.lead.create({
      data: {
        externalId: input.externalId,
        message: input.message,
        sourcePage: input.sourcePage,
        utmSource: input.utm?.source,
        utmMedium: input.utm?.medium,
        utmCampaign: input.utm?.campaign,
        contactId: contact.id,
        websiteId: website.id,
        propertyId: property?.id,
        activities: {
          create: {
            type: "STATUS_CHANGE",
            content: `Lead received from ${website.name}`,
          },
        },
      },
    });

    return { lead, duplicate: false };
  });

  return Response.json(
    {
      id: result.lead.id,
      stage: result.lead.stage,
      duplicate: result.duplicate,
    },
    { status: result.duplicate ? 200 : 201 },
  );
}
