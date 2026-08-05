import { z } from "zod";

import { leadIntakeSchema, type LeadIntake } from "@/lib/lead-intake";

const googleAdsColumnSchema = z.object({
  column_id: z.string().trim().min(1).max(160),
  column_name: z.string().trim().max(240).optional(),
  string_value: z.string().max(5000).optional(),
});

export const googleAdsLeadSchema = z.object({
  // Google Ads lead submission IDs are opaque and can exceed 160 characters.
  lead_id: z.string().trim().min(1).max(1000),
  user_column_data: z.array(googleAdsColumnSchema).max(100).default([]),
  api_version: z.string().max(40).optional(),
  form_id: z.union([z.string(), z.number()]).optional(),
  campaign_id: z.union([z.string(), z.number()]).optional(),
  adgroup_id: z.union([z.string(), z.number()]).optional(),
  creative_id: z.union([z.string(), z.number()]).optional(),
  asset_group_id: z.union([z.string(), z.number()]).optional(),
  gcl_id: z.string().max(500).optional(),
  google_key: z.string().min(1).max(500),
  is_test: z.boolean().optional(),
  lead_stage: z.string().max(100).optional(),
  lead_submit_time: z.string().max(100).optional(),
  lead_source: z.string().max(100).optional(),
});

export type GoogleAdsLead = z.infer<typeof googleAdsLeadSchema>;

const campaignNames: Record<string, string> = {
  "24101834365": "Midpoint Campaign",
  "24101993216": "Midpoint | Search | Midrand | Commercial Space",
};

function fieldMap(lead: GoogleAdsLead) {
  return new Map(
    lead.user_column_data.map((column) => [
      column.column_id.toUpperCase(),
      column.string_value?.trim() || undefined,
    ]),
  );
}

function firstValue(fields: Map<string, string | undefined>, ...keys: string[]) {
  for (const key of keys) {
    const value = fields.get(key);
    if (value) return value;
  }
  return undefined;
}

function splitName(fullName?: string) {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!parts.length) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function metadataLine(label: string, value?: string | number) {
  return value === undefined || value === "" ? undefined : `${label}: ${value}`;
}

export function googleAdsLeadToIntake(lead: GoogleAdsLead): LeadIntake {
  const fields = fieldMap(lead);
  const fullName = splitName(firstValue(fields, "FULL_NAME"));
  const firstName =
    firstValue(fields, "FIRST_NAME") ?? fullName.firstName ?? "Google Ads";
  const lastName = firstValue(fields, "LAST_NAME") ?? fullName.lastName;
  const email = firstValue(fields, "EMAIL", "WORK_EMAIL");
  const phone = firstValue(fields, "PHONE_NUMBER", "WORK_PHONE_NUMBER");
  const company = firstValue(fields, "COMPANY_NAME");
  const campaignId = lead.campaign_id?.toString();
  const campaignName = campaignId ? campaignNames[campaignId] : undefined;
  const knownFields = new Set([
    "FULL_NAME", "FIRST_NAME", "LAST_NAME", "EMAIL", "WORK_EMAIL",
    "PHONE_NUMBER", "WORK_PHONE_NUMBER", "COMPANY_NAME",
  ]);
  const answers = lead.user_column_data
    .filter((column) => !knownFields.has(column.column_id.toUpperCase()))
    .map((column) =>
      metadataLine(column.column_name ?? column.column_id, column.string_value),
    )
    .filter(Boolean);
  const message = [
    lead.is_test ? "Google Ads test submission" : undefined,
    ...answers,
    metadataLine("Campaign", campaignName ?? campaignId),
    metadataLine("Form ID", lead.form_id?.toString()),
    metadataLine("Google click ID", lead.gcl_id),
    metadataLine("Submitted", lead.lead_submit_time),
  ].filter(Boolean).join("\n");

  return leadIntakeSchema.parse({
    source: { slug: "google-ads-midpoint", name: "Google Ads - Midpoint", domain: "ads.google.com" },
    externalId: lead.lead_id,
    contact: { firstName, lastName, email, phone, company },
    ...(message ? { message } : {}),
    sourcePage: "https://www.mid-point.co.za/",
    utm: {
      source: "google",
      medium: "paid-search",
      campaign: campaignName ?? campaignId ?? "google-lead-form",
    },
  });
}
