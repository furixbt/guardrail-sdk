import type { PlanStep, RiskAnalyzer, RiskFlag } from "@guardrail/core";

import { detectApprovalRisks } from "./utils";

export type CreateEvmRiskAnalyzerOptions = {
  /** If true, include approval decoding heuristics (approve/infinite/permit2). */
  approvals?: boolean;
};

export function createEvmRiskAnalyzer(opts: CreateEvmRiskAnalyzerOptions = {}): RiskAnalyzer {
  const approvals = opts.approvals ?? true;

  async function analyzeStep(step: PlanStep): Promise<RiskFlag[]> {
    if (!approvals) return [];
    if (step.kind !== "tx") return [];

    // We only decode ERC-20 approve risks for now.
    return detectApprovalRisks({ to: step.tx.to, data: step.tx.data });
  }

  return { analyzeStep };
}
