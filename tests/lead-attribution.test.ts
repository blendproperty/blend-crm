import assert from "node:assert/strict";
import test from "node:test";

import { getLeadAttribution } from "../src/lib/lead-attribution";

test("separates Google Ads attribution from a Midpoint lead message", () => {
  const attribution = getLeadAttribution({
    websiteName: "Midpoint",
    message: [
      "Interest: Warehouse space",
      "",
      "I need warehouse space.",
      "",
      "First source: google / cpc / pmax",
      "Conversion source: google / cpc / pmax",
      "Landing page: /vacancies/apply?utm_source=google",
      "Google Ads click ID: click-123",
    ].join("\n"),
  });

  assert.equal(attribution.primarySource, "Google Ads");
  assert.equal(attribution.receivingWebsite, "Midpoint");
  assert.equal(attribution.utmSource, "google");
  assert.equal(attribution.utmMedium, "cpc");
  assert.equal(attribution.utmCampaign, "pmax");
  assert.equal(attribution.message, "Interest: Warehouse space\n\nI need warehouse space.");
  assert.equal(attribution.landingPage, "/vacancies/apply?utm_source=google");
  assert.equal(attribution.googleClickId, "click-123");
});
