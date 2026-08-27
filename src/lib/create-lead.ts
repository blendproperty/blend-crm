import "server-only";

import { db } from "@/lib/db";
import { detectAutoKillReason } from "@/lib/auto-kill";
import { sendAssignmentEmail } from "@/lib/email";
import { getLeadAttribution } from "@/lib/lead-attribution";
import {
  type LeadIntake,
  normalizeEmail,
  normalizePhone,
} from "@/lib/lead-intake";

export async function createLeadFromIntake(input: LeadIntake) {
  const normalizedEmail = normalizeEmail(input.contact.email);
  const normalizedPhone = normalizePhone(input.contact.phone);
  const autoKillReason = detectAutoKillReason(input);

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
        return { lead: existingLead, duplicate: true, assignee: null };
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

    const assignee = autoKillReason
      ? null
      : await transaction.user.findFirst({
          where: {
            email: (process.env.LEAD_DEFAULT_ASSIGNEE_EMAIL ?? "boitumelo@blendproperty.co.za").toLowerCase(),
            active: true,
          },
          select: { id: true, name: true, email: true },
        });

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
        assignedToId: assignee?.id,
        ...(assignee ? { stage: "ASSIGNED" as const } : {}),
        ...(autoKillReason
          ? {
              stage: "KILLED" as const,
              killedReason: autoKillReason,
              killedAt: new Date(),
              killedAutomatically: true,
              closedAt: new Date(),
            }
          : {}),
        activities: {
          create: [
            {
              type: "STATUS_CHANGE",
              content: `Lead received from ${website.name}`,
            },
            ...(assignee
              ? [{
                  type: "ASSIGNMENT" as const,
                  content: `Lead automatically assigned to ${assignee.name}`,
                }]
              : []),
            ...(!assignee && !autoKillReason
              ? [{
                  type: "ASSIGNMENT" as const,
                  content: "Automatic assignment could not be completed because the configured assignee was not found",
                }]
              : []),
            ...(autoKillReason
              ? [{
                  type: "STATUS_CHANGE" as const,
                  content: `Lead automatically killed: ${autoKillReason}`,
                }]
              : []),
          ],
        },
      },
    });

    return { lead, duplicate: false, assignee };
  });

  if (!result.duplicate && result.assignee) {
    const contactName = `${input.contact.firstName} ${input.contact.lastName ?? ""}`.trim();
    const attribution = getLeadAttribution({
      message: input.message,
      websiteName: input.source.name,
      sourcePage: input.sourcePage,
      utmSource: input.utm?.source,
      utmMedium: input.utm?.medium,
      utmCampaign: input.utm?.campaign,
    });
    try {
      const emailResult = await sendAssignmentEmail({
        to: result.assignee.email,
        assigneeName: result.assignee.name,
        assignedByName: "Blend CRM automation",
        contactName,
        contactEmail: input.contact.email ?? null,
        contactPhone: input.contact.phone ?? null,
        company: input.contact.company ?? null,
        propertyName: input.property ? `${input.property.title} (${input.property.reference})` : "General enquiry",
        priority: result.lead.priority,
        message: attribution.message,
        attribution: [
          { label: "Original source", value: attribution.primarySource },
          { label: "Receiving website", value: attribution.receivingWebsite },
          ...(attribution.utmSource ? [{ label: "UTM source", value: attribution.utmSource }] : []),
          ...(attribution.utmMedium ? [{ label: "UTM medium", value: attribution.utmMedium }] : []),
          ...(attribution.utmCampaign ? [{ label: "UTM campaign", value: attribution.utmCampaign }] : []),
          ...(attribution.landingPage ? [{ label: "Landing page", value: attribution.landingPage }] : []),
          ...(attribution.googleClickId ? [{ label: "Google Ads click ID", value: attribution.googleClickId }] : []),
        ],
        leadUrl: `${(process.env.CRM_PUBLIC_URL ?? "https://crm.onpointoffices.co.za").replace(/\/$/, "")}/leads/${result.lead.id}`,
      });
      await db.activity.create({
        data: {
          type: "ASSIGNMENT",
          content: emailResult.status === "sent"
            ? `Automatic assignment email sent to ${result.assignee.name}`
            : "Automatic assignment email not sent because SMTP is not configured",
          leadId: result.lead.id,
        },
      });
    } catch (error) {
      console.error("Automatic assignment email delivery failed", error);
      await db.activity.create({
        data: { type: "ASSIGNMENT", content: `Automatic assignment email to ${result.assignee.name} failed`, leadId: result.lead.id },
      }).catch(() => undefined);
    }
  }

  return { lead: result.lead, duplicate: result.duplicate };
}
