import type { Explain, Hex, Planner, PlanStep, RiskFlag } from "@guardrail/core";
import { randomUUID } from "node:crypto";
import { encodeFunctionData, erc20Abi } from "viem";

import { detectApprovalRisks } from "@guardrail/evm";

function explain(title: string, summary: string, bullets?: string[]): Explain {
  return { title, summary, bullets };
}

export type GuardrailActionPlannerOptions = {
  chainId: number;
};

export function createActionPlanner(opts: GuardrailActionPlannerOptions): Planner {
  async function plan(input: { chainId: number; action: string; params: Record<string, unknown> }) {
    if (input.chainId !== opts.chainId) {
      throw new Error(`Planner configured for chainId=${opts.chainId}, got ${input.chainId}`);
    }

    const id = randomUUID();
    const createdAt = Date.now();

    const steps: PlanStep[] = [];
    let topExplain: Explain = explain("Unknown action", input.action);

    if (input.action === "transfer.native") {
      const p = input.params as any;
      topExplain = explain("Native transfer", `Send native value to ${p.to}`, [
        `To: ${p.to}`,
        `Value (wei): ${String(p.valueWei)}`
      ]);
      steps.push({
        kind: "tx",
        tx: { to: p.to, value: BigInt(p.valueWei) },
        explain: topExplain
      });
    } else if (input.action === "erc20.approve") {
      const p = input.params as any;
      const data = encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [p.spender, BigInt(p.amount)] }) as Hex;
      const risks: RiskFlag[] = detectApprovalRisks({ to: p.token, data });
      topExplain = explain("ERC-20 approve", `Approve spender to spend your token`, [
        `Token: ${p.token}`,
        `Spender: ${p.spender}`,
        `Amount: ${String(p.amount)}`
      ]);
      steps.push({
        kind: "tx",
        tx: { to: p.token, data },
        explain: topExplain,
        riskFlags: risks
      });
    } else if (input.action === "erc20.transfer") {
      const p = input.params as any;
      const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [p.to, BigInt(p.amount)] }) as Hex;
      topExplain = explain("ERC-20 transfer", `Transfer token to ${p.to}`, [
        `Token: ${p.token}`,
        `To: ${p.to}`,
        `Amount: ${String(p.amount)}`
      ]);
      steps.push({
        kind: "tx",
        tx: { to: p.token, data },
        explain: topExplain
      });
    } else if (input.action === "swap.raw" || input.action === "swap.uniswap.universalRouterRaw") {
      const p = input.params as any;
      const title = input.action === "swap.raw" ? "Swap (raw calldata)" : "Uniswap Swap (Universal Router)";
      topExplain = explain(title, p.summary ?? "Swap via router", [`Router: ${p.router}`]);
      steps.push({
        kind: "tx",
        tx: { to: p.router, data: p.data, value: p.valueWei ? BigInt(p.valueWei) : undefined },
        explain: topExplain
      });
    } else {
      throw new Error(`Unknown action: ${input.action}`);
    }

    return {
      id,
      createdAt,
      chainId: input.chainId,
      intent: { action: input.action, params: input.params },
      explain: topExplain,
      steps
    };
  }

  return { plan };
}
