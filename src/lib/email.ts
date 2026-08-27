import nodemailer from "nodemailer";

type AssignmentEmail = {
  to: string;
  assigneeName: string;
  assignedByName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  company: string | null;
  propertyName: string;
  priority: string;
  message: string | null;
  attribution?: Array<{ label: string; value: string }>;
  leadUrl: string;
};

function requiredEmailConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.SMTP_FROM?.trim();
  if (!host || !user || !password || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid TCP port");
  }

  return {
    host,
    port,
    secure: process.env.SMTP_SECURE === "true" || port === 465,
    user,
    password,
    from,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendConfiguredEmail(input: { to: string; subject: string; text: string; html: string }) {
  const config = requiredEmailConfig();
  if (!config) return { status: "not_configured" as const };
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  const result = await transport.sendMail({ from: config.from, ...input });
  return { status: "sent" as const, messageId: result.messageId };
}

export function buildAssignmentEmail(input: AssignmentEmail) {
  const contactDetails = [input.contactEmail, input.contactPhone].filter(Boolean).join(" · ") || "No contact details supplied";
  const subject = `New CRM lead assigned: ${input.contactName}`;
  const text = [
    `Hi ${input.assigneeName},`,
    "",
    `${input.assignedByName} assigned a CRM lead to you.`,
    "",
    `Contact: ${input.contactName}`,
    `Contact details: ${contactDetails}`,
    `Company: ${input.company ?? "Not supplied"}`,
    `Property / enquiry: ${input.propertyName}`,
    `Priority: ${input.priority}`,
    `Message: ${input.message ?? "No message supplied"}`,
    ...(input.attribution?.map(({ label, value }) => `${label}: ${value}`) ?? []),
    "",
    `Open lead: ${input.leadUrl}`,
  ].join("\n");

  const row = (label: string, value: string) => `<tr><td style="padding:8px 12px;color:#66746e;font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#071839;font-size:14px;font-weight:600;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`;
  const attributionRows = input.attribution?.map(({ label, value }) => row(label, value)).join("") ?? "";
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,sans-serif;color:#071839"><div style="max-width:640px;margin:0 auto;padding:32px 16px"><div style="background:#071839;padding:24px;border-radius:14px 14px 0 0"><div style="width:48px;height:4px;background:#c0ff72;border-radius:999px;margin-bottom:16px"></div><div style="color:#fff;font-size:22px;font-weight:800">BLEND</div><div style="color:#9aa6bc;font-size:10px;letter-spacing:2px">PROPERTY GROUP CRM</div></div><div style="background:#fff;padding:28px;border-radius:0 0 14px 14px"><h1 style="margin:0 0 12px;font-size:24px">New lead assigned to you</h1><p style="margin:0 0 22px;color:#52615a;line-height:1.6">Hi ${escapeHtml(input.assigneeName)}, ${escapeHtml(input.assignedByName)} assigned this lead to you.</p><table style="width:100%;border-collapse:collapse;background:#f8faf9;border-radius:10px">${row("Contact", input.contactName)}${row("Contact details", contactDetails)}${row("Company", input.company ?? "Not supplied")}${row("Property / enquiry", input.propertyName)}${row("Priority", input.priority)}${row("Message", input.message ?? "No message supplied")}${attributionRows}</table><p style="margin:24px 0 0"><a href="${escapeHtml(input.leadUrl)}" style="display:inline-block;background:#159a70;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:9px">Open lead in CRM</a></p></div></div></body></html>`;

  return { subject, text, html };
}

export async function sendAssignmentEmail(input: AssignmentEmail) {
  const content = buildAssignmentEmail(input);
  return sendConfiguredEmail({ to: input.to, ...content });
}

export function buildSlaReminderEmail(input: { assigneeName: string; contactName: string; leadUrl: string }) {
  const subject = `Reminder: CRM lead awaiting first response — ${input.contactName}`;
  const text = `Hi ${input.assigneeName},\n\nA quick reminder that the lead for ${input.contactName} has been assigned to you and is still awaiting its first recorded response. Please update the stage or add a note once attended.\n\nOpen lead: ${input.leadUrl}`;
  const html = `<p>Hi ${escapeHtml(input.assigneeName)},</p><p>A quick reminder that the lead for <strong>${escapeHtml(input.contactName)}</strong> has been assigned to you and is still awaiting its first recorded response.</p><p>Please update the stage or add a note once attended.</p><p><a href="${escapeHtml(input.leadUrl)}">Open lead in CRM</a></p>`;
  return { subject, text, html };
}

export async function sendSlaReminderEmail(input: { to: string; assigneeName: string; contactName: string; leadUrl: string }) {
  const { to, ...contentInput } = input;
  return sendConfiguredEmail({ to, ...buildSlaReminderEmail(contentInput) });
}

export function buildSlaEscalationEmail(input: { recipientName: string; leads: Array<{ contactName: string; assigneeName: string; ageHours: number; leadUrl: string }> }) {
  const subject = `${input.leads.length} CRM lead${input.leads.length === 1 ? "" : "s"} may need assistance`;
  const intro = `The following lead${input.leads.length === 1 ? " has" : "s have"} not yet had a first response recorded after 24 hours. This is an operational visibility notice so support can be arranged where needed; ownership has not been changed.`;
  const textRows = input.leads.map((lead) => `- ${lead.contactName} — assigned to ${lead.assigneeName} — ${lead.ageHours} hours — ${lead.leadUrl}`);
  const text = [`Hi ${input.recipientName},`, "", intro, "", ...textRows].join("\n");
  const htmlRows = input.leads.map((lead) => `<li style="margin-bottom:10px"><a href="${escapeHtml(lead.leadUrl)}"><strong>${escapeHtml(lead.contactName)}</strong></a> — assigned to ${escapeHtml(lead.assigneeName)} — ${lead.ageHours} hours</li>`).join("");
  const html = `<p>Hi ${escapeHtml(input.recipientName)},</p><p>${escapeHtml(intro)}</p><ul>${htmlRows}</ul>`;
  return { subject, text, html };
}

export async function sendSlaEscalationEmail(input: { to: string; recipientName: string; leads: Array<{ contactName: string; assigneeName: string; ageHours: number; leadUrl: string }> }) {
  const { to, ...contentInput } = input;
  return sendConfiguredEmail({ to, ...buildSlaEscalationEmail(contentInput) });
}
