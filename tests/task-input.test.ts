import assert from "node:assert/strict";
import test from "node:test";

import { taskInputSchema } from "../src/lib/task-input";

test("call-back follow-ups require a due date and time", () => {
  const missing = taskInputSchema.safeParse({ type: "CALLBACK", title: "Call prospect" });
  assert.equal(missing.success, false);
  if (!missing.success) assert.match(missing.error.issues[0]?.message ?? "", /required/i);

  const valid = taskInputSchema.safeParse({
    type: "CALLBACK",
    title: "Call prospect",
    dueAt: "2026-09-09T10:00:00.000Z",
  });
  assert.equal(valid.success, true);
});

test("general tasks keep the due date optional", () => {
  assert.equal(taskInputSchema.safeParse({ type: "GENERAL", title: "Review lead" }).success, true);
});
