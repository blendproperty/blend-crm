import assert from "node:assert/strict";
import test from "node:test";

import { googleAdsLeadSchema, googleAdsLeadToIntake } from "../src/lib/google-ads-lead";

const payload = {
  lead_id: "google-lead-123",
  campaign_id: 24101834365,
  form_id: 987654321,
  gcl_id: "test-click-id",
  google_key: "test-key",
  is_test: true,
  user_column_data: [
    { column_id: "FULL_NAME", column_name: "Full Name", string_value: "Brett Dovey" },
    { column_id: "EMAIL", column_name: "Email", string_value: "brett@example.com" },
    { column_id: "PHONE_NUMBER", column_name: "Phone", string_value: "+27 82 123 4567" },
    { column_id: "COMPANY_NAME", column_name: "Company", string_value: "Blend" },
    { column_id: "COMMERCIAL_REAL_ESTATE_TYPE", column_name: "Space required", string_value: "Office" },
  ],
};

test("maps a Google lead into the CRM intake contract", () => {
  const intake = googleAdsLeadToIntake(googleAdsLeadSchema.parse(payload));
  assert.equal(intake.externalId, "google-lead-123");
  assert.equal(intake.source.slug, "google-ads-midpoint");
  assert.deepEqual(intake.contact, {
    firstName: "Brett", lastName: "Dovey", email: "brett@example.com",
    phone: "+27 82 123 4567", company: "Blend",
  });
  assert.match(intake.message ?? "", /Google Ads test submission/);
  assert.match(intake.message ?? "", /Space required: Office/);
  assert.equal(intake.utm?.campaign, "Midpoint Campaign");
});

test("uses separate first and last name fields when supplied", () => {
  const intake = googleAdsLeadToIntake(googleAdsLeadSchema.parse({
    ...payload,
    user_column_data: [
      { column_id: "FIRST_NAME", string_value: "Brett" },
      { column_id: "LAST_NAME", string_value: "Dovey" },
      { column_id: "WORK_EMAIL", string_value: "work@example.com" },
    ],
  }));
  assert.equal(intake.contact.firstName, "Brett");
  assert.equal(intake.contact.lastName, "Dovey");
  assert.equal(intake.contact.email, "work@example.com");
});

test("rejects a lead with no email address or phone number", () => {
  const lead = googleAdsLeadSchema.parse({
    ...payload,
    user_column_data: [{ column_id: "FULL_NAME", string_value: "No Contact" }],
  });
  assert.throws(() => googleAdsLeadToIntake(lead));
});
