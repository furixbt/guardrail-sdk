// src/policy.ts
import { z } from "zod";
var PolicySchema = z.object({
  // Hard limits
  maxValueWeiPerTx: z.bigint().optional(),
  // ERC-20 approvals
  noInfiniteApprovals: z.boolean().default(true),
  // Contract allow/deny
  allowTo: z.array(z.string()).optional(),
  denyTo: z.array(z.string()).optional(),
  // Human approval
  requireApprovalAboveValueWei: z.bigint().optional()
}).strict();
function createPolicyEngine(policy) {
  const cfg = PolicySchema.parse(policy);
  function violation(code, message, data) {
    return { code, severity: "high", message, data };
  }
  function warn(code, message, data) {
    return { code, severity: "medium", message, data };
  }
  function evaluatePlan(plan) {
    const v = [];
    if (cfg.maxValueWeiPerTx != null) {
      for (const step of plan.steps) {
        const val = step.tx.value ?? 0n;
        if (val > cfg.maxValueWeiPerTx) {
          v.push(violation("policy.maxValueWeiPerTx", `Tx value ${val} exceeds limit ${cfg.maxValueWeiPerTx}`));
        }
      }
    }
    const allowTo = cfg.allowTo?.map((s) => s.toLowerCase());
    const denyTo = cfg.denyTo?.map((s) => s.toLowerCase());
    for (const step of plan.steps) {
      const to = step.tx.to.toLowerCase();
      if (denyTo?.includes(to)) v.push(violation("policy.denyTo", `Destination contract/address is denied: ${step.tx.to}`));
      if (allowTo && !allowTo.includes(to)) v.push(violation("policy.allowTo", `Destination not in allowlist: ${step.tx.to}`));
    }
    if (cfg.noInfiniteApprovals) {
      for (const step of plan.steps) {
        const flags = step.riskFlags ?? [];
        const hasInfinite = flags.some((f) => f.code === "evm.approval.infinite");
        if (hasInfinite) {
          v.push(violation("policy.noInfiniteApprovals", "Infinite approval is not allowed by policy."));
        }
      }
    }
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

// src/audit.ts
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
function stableStringify(obj) {
  return JSON.stringify(obj, null, 2);
}
function fileAudit(opts) {
  const base = opts.dir;
  async function ensureDir(p) {
    await mkdir(p, { recursive: true });
  }
  async function writePlan(plan) {
    const dir = join(base, plan.id);
    await ensureDir(dir);
    await writeFile(join(dir, "plan.json"), stableStringify(plan), "utf8");
  }
  async function writeExecution(planId, data) {
    const dir = join(base, planId);
    await ensureDir(dir);
    await writeFile(join(dir, `execution-${Date.now()}.json`), stableStringify(data), "utf8");
  }
  return { writePlan, writeExecution };
}

// src/sdk.ts
function createGuardrail(opts) {
  const chainId = opts.chainId;
  async function plan(action, params) {
    const unscored = await opts.planner.plan({ chainId, action, params });
    const steps = await Promise.all(
      unscored.steps.map(async (s) => {
        const analyzed = opts.riskAnalyzer ? await opts.riskAnalyzer.analyzeStep(s, chainId) : [];
        const riskFlags = [...s.riskFlags ?? [], ...analyzed];
        const simulation = await opts.simulator.simulateTx({ ...s, riskFlags }, chainId);
        return { ...s, riskFlags, simulation };
      })
    );
    const withoutPolicy = { ...unscored, steps };
    const decision = opts.policy.evaluatePlan(withoutPolicy);
    const full = {
      ...withoutPolicy,
      policy: decision
    };
    if (opts.audit) await opts.audit.writePlan(full);
    return full;
  }
  async function execute(p) {
    if (!p.policy.allowed) {
      const summary = p.policy.violations.map((v) => `${v.severity.toUpperCase()} ${v.code}: ${v.message}`).join("\n");
      throw new Error(`Policy blocked execution:
${summary}`);
    }
    if (opts.approver) {
      const ok = await opts.approver.approve({ plan: p, summary: p.explain.summary });
      if (!ok) throw new Error("Execution rejected by approver.");
    }
    const receipts = [];
    for (const step of p.steps) {
      const receipt = await opts.executor.executeTx(step, chainId);
      receipts.push(receipt);
      if (opts.audit) await opts.audit.writeExecution(p.id, { step, receipt });
    }
    return { planId: p.id, receipts };
  }
  return { plan, execute };
}
export {
  PolicySchema,
  createGuardrail,
  createPolicyEngine,
  fileAudit
};
