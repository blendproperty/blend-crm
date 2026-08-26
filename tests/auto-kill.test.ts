import assert from "node:assert/strict";
import test from "node:test";

import { detectAutoKillReason } from "../src/lib/auto-kill";

const jobEnquiries = [
  "I am submitting a job application",
  "I am looking for a job",
  "Please find my CV attached",
  "Do you have any open vacancies?",
  "This is an employment enquiry",
  "This is a job enquiry",
  "job",
];

for (const message of jobEnquiries) {
  test(`auto-kills an explicit career enquiry: ${message}`, () => {
    assert.equal(
      detectAutoKillReason({ message }),
      "Job or career enquiry detected from message",
    );
  });
}

test("auto-kills enquiries submitted from a careers page", () => {
  assert.equal(
    detectAutoKillReason({ sourcePage: "/careers/apply" }),
      "Job or career enquiry detected from source page",
  );
});

test("auto-kills enquiries submitted from a vacancies page", () => {
  assert.equal(
    detectAutoKillReason({ sourcePage: "https://www.mid-point.co.za/vacancies/warehouse" }),
    "Job or career enquiry detected from source page",
  );
});

test("auto-kills legacy enquiries whose landing page is embedded in the message", () => {
  assert.equal(
    detectAutoKillReason({ message: "Warehouse enquiry\n\nLanding page: /vacancies/apply?utm_source=google" }),
    "Job or career enquiry detected from source page",
  );
});

const legitimatePropertyEnquiries = [
  "We need office space for our growing workforce",
  "We need a property where construction work can be completed",
  "The development will create 20 jobs",
  "I work for a logistics company and need a warehouse",
];

for (const message of legitimatePropertyEnquiries) {
  test(`keeps a legitimate property enquiry active: ${message}`, () => {
    assert.equal(detectAutoKillReason({ message }), null);
  });
}
