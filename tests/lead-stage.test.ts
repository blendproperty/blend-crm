import assert from "node:assert/strict";
import test from "node:test";

import { hasRequiredStageChangeNote, requiresStageChangeNote, resolveLeadStageUpdate } from "../src/lib/lead-stage";

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

test("progressed, closed and killed stage changes require a non-empty note", () => {
  for (const targetStage of ["CONTACTED", "QUALIFIED", "VIEWING", "NEGOTIATION", "WON", "LOST", "KILLED"] as const) {
    assert.equal(requiresStageChangeNote({ existingStage: "ASSIGNED", targetStage }), true);
    assert.equal(hasRequiredStageChangeNote({ existingStage: "ASSIGNED", targetStage }), false);
    assert.equal(hasRequiredStageChangeNote({ existingStage: "ASSIGNED", targetStage, note: "   " }), false);
    assert.equal(hasRequiredStageChangeNote({ existingStage: "ASSIGNED", targetStage, note: "Stage updated after follow-up" }), true);
  }
});

test("new, assigned and unchanged stages do not require a note", () => {
  assert.equal(hasRequiredStageChangeNote({ existingStage: "CONTACTED", targetStage: "NEW" }), true);
  assert.equal(hasRequiredStageChangeNote({ existingStage: "NEW", targetStage: "ASSIGNED" }), true);
  assert.equal(hasRequiredStageChangeNote({ existingStage: "QUALIFIED", targetStage: "QUALIFIED" }), true);
});
