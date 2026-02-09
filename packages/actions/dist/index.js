var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/planner.ts
import { randomUUID } from "crypto";
import { encodeFunctionData, erc20Abi } from "viem";
import { detectApprovalRisks } from "@guardrail/evm";
function explain(title, summary, bullets) {
  return { title, summary, bullets };
}
function createActionPlanner(opts) {
  async function plan(input) {
    if (input.chainId !== opts.chainId) {
      throw new Error(`Planner configured for chainId=${opts.chainId}, got ${input.chainId}`);
    }
    const id = randomUUID();
    const createdAt = Date.now();
    const steps = [];
    let topExplain = explain("Unknown action", input.action);
    if (input.action === "transfer.native") {
      const p = input.params;
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
      const p = input.params;
      const data = encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [p.spender, BigInt(p.amount)] });
      const risks = detectApprovalRisks({ to: p.token, data });
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
      const p = input.params;
      const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [p.to, BigInt(p.amount)] });
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
      const p = input.params;
      const title = input.action === "swap.raw" ? "Swap (raw calldata)" : "Uniswap Swap (Universal Router)";
      topExplain = explain(title, p.summary ?? "Swap via router", [`Router: ${p.router}`]);
      steps.push({
        kind: "tx",
        tx: { to: p.router, data: p.data, value: p.valueWei ? BigInt(p.valueWei) : void 0 },
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

// src/ops.ts
var ops_exports = {};
__export(ops_exports, {
  approveExact: () => approveExact,
  erc20Approve: () => erc20Approve,
  erc20Transfer: () => erc20Transfer,
  swapRaw: () => swapRaw,
  swapUniswapUniversalRouterRaw: () => swapUniswapUniversalRouterRaw,
  transfer: () => transfer
});
var transfer = (p) => ({ action: "transfer.native", params: p });
var erc20Approve = (p) => ({ action: "erc20.approve", params: p });
var approveExact = erc20Approve;
var erc20Transfer = (p) => ({ action: "erc20.transfer", params: p });
var swapRaw = (p) => ({ action: "swap.raw", params: p });
var swapUniswapUniversalRouterRaw = (p) => ({
  action: "swap.uniswap.universalRouterRaw",
  params: p
});
export {
  ops_exports as actions,
  createActionPlanner
};
