import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).optional();

export const leadIntakeSchema = z
  .object({
    source: z.object({
      slug: z
        .string()
        .trim()
        .min(2)
        .max(80)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      name: z.string().trim().min(2).max(120),
      domain: optionalText(255),
    }),
    // External source identifiers are opaque and may be substantially longer
    // than user-entered reference values (for example, Google Ads lead IDs).
    externalId: optionalText(1000),
    contact: z.object({
      firstName: z.string().trim().min(1).max(100),
      lastName: optionalText(100),
      email: z.string().trim().email().max(320).optional(),
      phone: optionalText(40),
      company: optionalText(160),
    }),
    property: z
      .object({
        reference: z.string().trim().min(1).max(120),
        title: z.string().trim().min(1).max(240),
        address: optionalText(500),
      })
      .optional(),
    message: optionalText(5000),
    sourcePage: z.string().url().max(2000).optional(),
    utm: z
      .object({
        source: optionalText(255),
        medium: optionalText(255),
        campaign: optionalText(255),
      })
      .optional(),
  })
  .refine((value) => value.contact.email || value.contact.phone, {
    message: "An email address or phone number is required",
    path: ["contact"],
  });

export type LeadIntake = z.infer<typeof leadIntakeSchema>;

export function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase();
}

export function normalizePhone(phone?: string) {
  if (!phone) return undefined;

  const trimmed = phone.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D/g, "");

  return digits ? `${prefix}${digits}` : undefined;
}
