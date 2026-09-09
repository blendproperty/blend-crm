import assert from "node:assert/strict";
import test from "node:test";

import { leadAssigneeEmail } from "../src/lib/lead-routing";
import type { LeadIntake } from "../src/lib/lead-intake";

const lead: LeadIntake = {
  source: { slug: "blend-listings", name: "Blend Listings" },
  contact: { firstName: "Test", email: "test@example.com" },
  property: { reference: "P24-1", title: "Office property in Bedfordview" },
};

test("routes Bedfordview property leads to Brad", () => {
  assert.equal(leadAssigneeEmail(lead, null), "brad@blendproperty.co.za");
});

test("job enquiries are killed before Bedfordview routing", () => {
  assert.equal(leadAssigneeEmail({ ...lead, message: "I need a job" }, "Job enquiry"), null);
});

test("routes other property leads to the default assignee", () => {
  assert.equal(leadAssigneeEmail({ ...lead, property: { reference: "MID-1", title: "Midrand office" } }, null), "boitumelo@blendproperty.co.za");
});
