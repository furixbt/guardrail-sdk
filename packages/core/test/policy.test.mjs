import test from "node:test";
import assert from "node:assert/strict";

import { createPolicyEngine } from "../dist/index.js";

function mkPlan(steps) {
  return {
    id: "p",
    createdAt: Date.now(),
    chainId: 8453,
    intent: { action: "x", params: {} },
    explain: { title: "t", summary: "s" },
    steps,
  };
}

test("policy blocks denyTo", () => {
  const engine = createPolicyEngine({ denyTo: ["0x0000000000000000000000000000000000000001"] });
  const plan = mkPlan([{ kind: "tx", tx: { to: "0x0000000000000000000000000000000000000001" } }]);

  const decision = engine.evaluatePlan(plan);
  assert.equal(decision.allowed, false);
  assert.ok(decision.violations.some((v) => v.code === "policy.denyTo"));
});

test("policy blocks infinite approvals when flagged", () => {
  const engine = createPolicyEngine({ noInfiniteApprovals: true });
  const plan = mkPlan([
    {
      kind: "tx",
      tx: { to: "0x0000000000000000000000000000000000000002" },
      riskFlags: [{ code: "evm.approval.infinite", severity: "high", message: "infinite" }],
    },
  ]);

  const decision = engine.evaluatePlan(plan);
  assert.equal(decision.allowed, false);
  assert.ok(decision.violations.some((v) => v.code === "policy.noInfiniteApprovals"));
});
