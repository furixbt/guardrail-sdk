import { createGuardrail, createPolicyEngine, fileAudit } from "@guardrail/core";
import { createActionPlanner } from "@guardrail/actions";
import { createEvmClients, createEvmExecutor, createEvmSimulator } from "@guardrail/evm";
import { base } from "viem/chains";

// Demo only. Provide env vars:
// RPC_URL=https://base-mainnet.yourprovider
// NOTE: executor requires an account; wire EIP-1193 (browser) or a viem Account.

const chain = base;
const chainId = chain.id;

const rpcUrl = process.env.RPC_URL;
if (!rpcUrl) throw new Error("Set RPC_URL");

const clients = createEvmClients({ chain, rpcUrl });

const sdk = createGuardrail({
  chainId,
  planner: createActionPlanner({ chainId }),
  simulator: createEvmSimulator(clients),
  executor: createEvmExecutor(clients),
  policy: createPolicyEngine({
    noInfiniteApprovals: true,
    maxValueWeiPerTx: 0n // no native value transfers in this demo
  }),
  audit: fileAudit({ dir: "./audit" })
});

const plan = await sdk.plan("erc20.approve", {
  token: "0x0000000000000000000000000000000000000000",
  spender: "0x0000000000000000000000000000000000000000",
  amount: 1n
});

console.log(JSON.stringify(plan, null, 2));
