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
    "",
    `Open lead: ${input.leadUrl}`,
  ].join("\n");

  const row = (label: string, value: string) => `<tr><td style="padding:8px 12px;color:#66746e;font-size:13px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#071839;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f6f5;font-family:Arial,sans-serif;color:#071839"><div style="max-width:640px;margin:0 auto;padding:32px 16px"><div style="background:#071839;padding:24px;border-radius:14px 14px 0 0"><div style="width:48px;height:4px;background:#c0ff72;border-radius:999px;margin-bottom:16px"></div><div style="color:#fff;font-size:22px;font-weight:800">BLEND</div><div style="color:#9aa6bc;font-size:10px;letter-spacing:2px">PROPERTY GROUP CRM</div></div><div style="background:#fff;padding:28px;border-radius:0 0 14px 14px"><h1 style="margin:0 0 12px;font-size:24px">New lead assigned to you</h1><p style="margin:0 0 22px;color:#52615a;line-height:1.6">Hi ${escapeHtml(input.assigneeName)}, ${escapeHtml(input.assignedByName)} assigned this lead to you.</p><table style="width:100%;border-collapse:collapse;background:#f8faf9;border-radius:10px">${row("Contact", input.contactName)}${row("Contact details", contactDetails)}${row("Company", input.company ?? "Not supplied")}${row("Property / enquiry", input.propertyName)}${row("Priority", input.priority)}${row("Message", input.message ?? "No message supplied")}</table><p style="margin:24px 0 0"><a href="${escapeHtml(input.leadUrl)}" style="display:inline-block;background:#159a70;color:#fff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:9px">Open lead in CRM</a></p></div></div></body></html>`;

  return { subject, text, html };
}

export async function sendAssignmentEmail(input: AssignmentEmail) {
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
  const content = buildAssignmentEmail(input);
  const result = await transport.sendMail({
    from: config.from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  return { status: "sent" as const, messageId: result.messageId };
}
