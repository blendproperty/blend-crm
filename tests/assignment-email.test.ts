import assert from "node:assert/strict";
import test from "node:test";

import { buildAssignmentEmail } from "../src/lib/email";

test("buildAssignmentEmail includes lead and assignee details", () => {
  const email = buildAssignmentEmail({
    to: "agent@example.com",
    assigneeName: "Agent Name",
    assignedByName: "Admin Name",
    contactName: "Prospect Name",
    contactEmail: "prospect@example.com",
    contactPhone: "+27110000000",
    company: "Example Company",
    propertyName: "Unit 2 (BL-002)",
    priority: "HIGH",
    message: "Please call me",
    leadUrl: "https://crm.example.com/leads/lead-1",
  });

  assert.match(email.subject, /Prospect Name/);
  assert.match(email.text, /Agent Name/);
  assert.match(email.text, /Admin Name/);
  assert.match(email.text, /prospect@example.com/);
  assert.match(email.html, /https:\/\/crm\.example\.com\/leads\/lead-1/);
});

test("buildAssignmentEmail escapes untrusted lead content in HTML", () => {
  const email = buildAssignmentEmail({
    to: "agent@example.com",
    assigneeName: "Agent",
    assignedByName: "Admin",
    contactName: "<script>alert(1)</script>",
    contactEmail: null,
    contactPhone: null,
    company: null,
    propertyName: "General enquiry",
    priority: "NORMAL",
    message: "<img src=x onerror=alert(1)>",
    leadUrl: "https://crm.example.com/leads/lead-1",
  });

  assert.doesNotMatch(email.html, /<script>/);
  assert.doesNotMatch(email.html, /<img/);
  assert.match(email.html, /&lt;script&gt;/);
});
