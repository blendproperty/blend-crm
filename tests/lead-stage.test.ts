import assert from "node:assert/strict";
import test from "node:test";

import { hasRequiredKillNote, resolveLeadStageUpdate } from "../src/lib/lead-stage";

test("moves a new lead to assigned when an agent is allocated", () => {
  assert.equal(
    resolveLeadStageUpdate({ existingStage: "NEW", assignedToId: "agent-1" }),
    "ASSIGNED",
  );
});

test("does not move a progressed lead backwards when reassigned", () => {
  assert.equal(
    resolveLeadStageUpdate({ existingStage: "QUALIFIED", assignedToId: "agent-2" }),
    undefined,
  );
});

test("moves an assigned lead back to new when unassigned", () => {
  assert.equal(
    resolveLeadStageUpdate({ existingStage: "ASSIGNED", assignedToId: null }),
    "NEW",
  );
});

test("an explicitly selected stage takes precedence over assignment automation", () => {
  assert.equal(
    resolveLeadStageUpdate({
      existingStage: "NEW",
      requestedStage: "CONTACTED",
      assignedToId: "agent-1",
    }),
    "CONTACTED",
  );
});

test("manual killing requires a non-empty note", () => {
  assert.equal(hasRequiredKillNote("KILLED", undefined), false);
  assert.equal(hasRequiredKillNote("KILLED", "   "), false);
  assert.equal(hasRequiredKillNote("KILLED", "Duplicate job enquiry"), true);
});

test("other stage changes do not require a kill note", () => {
  assert.equal(hasRequiredKillNote("LOST", undefined), true);
});
