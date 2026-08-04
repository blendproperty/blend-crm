import { z } from "zod";

import { db } from "@/lib/db";
import { normalizeEmail, normalizePhone } from "@/lib/lead-intake";
import { getCurrentUser } from "@/lib/session";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

const schema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: optionalText(100),
    email: z.string().trim().email().max(320).optional(),
    phone: optionalText(40),
    company: optionalText(160),
    websiteId: optionalText(60),
    propertyReference: optionalText(120),
    propertyTitle: optionalText(240),
    message: optionalText(5000),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  })
  .refine((value) => value.email || value.phone, {
    message: "An email address or phone number is required",
  })
  .refine(
    (value) =>
      (!value.propertyReference && !value.propertyTitle) ||
      Boolean(value.propertyReference && value.propertyTitle),
    { message: "Both property reference and title are required" },
  );

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid lead" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);

  if (input.websiteId) {
    const website = await db.website.findFirst({
      where: { id: input.websiteId, active: true },
      select: { id: true },
    });
    if (!website) {
      return Response.json({ error: "Selected source website was not found" }, { status: 400 });
    }
  }

  const lead = await db.$transaction(async (transaction) => {
    const website = input.websiteId
      ? await transaction.website.findUniqueOrThrow({ where: { id: input.websiteId } })
      : await transaction.website.upsert({
          where: { slug: "manual" },
          update: { active: true },
          create: { slug: "manual", name: "Manual entry" },
        });

    const contact = await transaction.contact.findFirst({
      where: {
        OR: [
          ...(normalizedEmail ? [{ normalizedEmail }] : []),
          ...(normalizedPhone ? [{ normalizedPhone }] : []),
        ],
      },
    });
    const savedContact = contact
      ? await transaction.contact.update({
          where: { id: contact.id },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            normalizedEmail,
            phone: input.phone,
            normalizedPhone,
            company: input.company,
          },
        })
      : await transaction.contact.create({
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            normalizedEmail,
            phone: input.phone,
            normalizedPhone,
            company: input.company,
          },
        });

    const property =
      input.propertyReference && input.propertyTitle
        ? await transaction.property.upsert({
            where: { reference: input.propertyReference },
            update: { title: input.propertyTitle, active: true },
            create: {
              reference: input.propertyReference,
              title: input.propertyTitle,
            },
          })
        : null;

    return transaction.lead.create({
      data: {
        priority: input.priority,
        message: input.message,
        contactId: savedContact.id,
        websiteId: website.id,
        propertyId: property?.id,
        assignedToId: user.id,
        activities: {
          create: {
            type: "STATUS_CHANGE",
            content: `Lead created manually by ${user.name}`,
            userId: user.id,
          },
        },
      },
    });
  });

  return Response.json({ id: lead.id }, { status: 201 });
}
