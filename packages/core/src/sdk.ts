import type { Approver, AuditWriter, Executor, Plan, Planner, PolicyEngine, Simulator } from "./types";

export type GuardrailSDK = {
  plan(action: string, params: Record<string, unknown>): Promise<Plan>;
  execute(plan: Plan): Promise<{ planId: string; receipts: Array<{ txHash: `0x${string}` }> }>;
};

export type CreateGuardrailOptions = {
  chainId: number;
  planner: Planner;
  simulator: Simulator;
  executor: Executor;
  policy: PolicyEngine;
  audit?: AuditWriter;
  approver?: Approver;
};

export function createGuardrail(opts: CreateGuardrailOptions): GuardrailSDK {
  const chainId = opts.chainId;

  async function plan(action: string, params: Record<string, unknown>): Promise<Plan> {
    const unscored = await opts.planner.plan({ chainId, action, params });

    // simulate each step
    const steps = await Promise.all(
      unscored.steps.map(async (s) => {
        const simulation = await opts.simulator.simulateTx(s, chainId);
        return { ...s, simulation };
      })
    );

    const withoutPolicy = { ...unscored, steps };
    const decision = opts.policy.evaluatePlan(withoutPolicy);

    const full: Plan = {
      ...withoutPolicy,
      policy: decision
    };

    if (opts.audit) await opts.audit.writePlan(full);
    return full;
  }

  async function execute(p: Plan): Promise<{ planId: string; receipts: Array<{ txHash: `0x${string}` }> }> {
    if (!p.policy.allowed) {
      const summary = p.policy.violations.map((v) => `${v.severity.toUpperCase()} ${v.code}: ${v.message}`).join("\n");
      throw new Error(`Policy blocked execution:\n${summary}`);
    }

    if (opts.approver) {
      const ok = await opts.approver.approve({ plan: p, summary: p.explain.summary });
      if (!ok) throw new Error("Execution rejected by approver.");
    }

    const receipts: Array<{ txHash: `0x${string}` }> = [];
    for (const step of p.steps) {
      const receipt = await opts.executor.executeTx(step, chainId);
      receipts.push(receipt);
      if (opts.audit) await opts.audit.writeExecution(p.id, { step, receipt });
    }

    return { planId: p.id, receipts };
  }

  return { plan, execute };
}
