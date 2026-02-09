import { z } from "zod";

import type { Plan, PolicyDecision, PolicyEngine, RiskFlag } from "./types";

export const PolicySchema = z
  .object({
    // Hard limits
    maxValueWeiPerTx: z.bigint().optional(),

    // ERC-20 approvals
    noInfiniteApprovals: z.boolean().default(true),

    // Contract allow/deny
    allowTo: z.array(z.string()).optional(),
    denyTo: z.array(z.string()).optional(),

    // Human approval
    requireApprovalAboveValueWei: z.bigint().optional()
  })
  .strict();

export type Policy = z.infer<typeof PolicySchema>;

export function createPolicyEngine(policy: Policy): PolicyEngine {
  const cfg = PolicySchema.parse(policy);

  function violation(code: string, message: string, data?: unknown): RiskFlag {
    return { code, severity: "high", message, data };
  }

  function warn(code: string, message: string, data?: unknown): RiskFlag {
    return { code, severity: "medium", message, data };
  }

  function evaluatePlan(plan: Omit<Plan, "policy">): PolicyDecision {
    const v: RiskFlag[] = [];

    // Per-tx value limit
    if (cfg.maxValueWeiPerTx != null) {
      for (const step of plan.steps) {
        const val = step.tx.value ?? 0n;
        if (val > cfg.maxValueWeiPerTx) {
          v.push(violation("policy.maxValueWeiPerTx", `Tx value ${val} exceeds limit ${cfg.maxValueWeiPerTx}`));
        }
      }
    }

    // Contract allow/deny
    const allowTo = cfg.allowTo?.map((s) => s.toLowerCase());
    const denyTo = cfg.denyTo?.map((s) => s.toLowerCase());
    for (const step of plan.steps) {
      const to = step.tx.to.toLowerCase();
      if (denyTo?.includes(to)) v.push(violation("policy.denyTo", `Destination contract/address is denied: ${step.tx.to}`));
      if (allowTo && !allowTo.includes(to)) v.push(violation("policy.allowTo", `Destination not in allowlist: ${step.tx.to}`));
    }

    // Infinite approval check (heuristic): action authors should also set riskFlags.
    if (cfg.noInfiniteApprovals) {
      for (const step of plan.steps) {
        const flags = step.riskFlags ?? [];
        const hasInfinite = flags.some((f) => f.code === "evm.approval.infinite");
        if (hasInfinite) {
          v.push(violation("policy.noInfiniteApprovals", "Infinite approval is not allowed by policy."));
        }
      }
    }

    // Soft requirement for human approval (surfaced as warning, not a hard block)
    if (cfg.requireApprovalAboveValueWei != null) {
      const total = plan.steps.reduce((acc, s) => acc + (s.tx.value ?? 0n), 0n);
      if (total >= cfg.requireApprovalAboveValueWei) {
        v.push(warn(
          "policy.requireApproval",
          `Plan total value ${total} exceeds approval threshold ${cfg.requireApprovalAboveValueWei}`
        ));
      }
    }

    const hard = v.filter((x) => x.severity === "high");
    return { allowed: hard.length === 0, violations: v };
  }

  return { evaluatePlan };
}
