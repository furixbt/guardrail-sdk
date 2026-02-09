# Guardrail

Safe-by-default **Agent Wallet SDK** for EVM.

Core idea: **plan → explain → simulate → policy-check → (optional human approval) → execute**, with deterministic audit logs.

## Packages

- `@guardrail/core` — planning, policy engine, audit trail, approvals
- `@guardrail/evm` — EVM adapter (Base-first), simulation + calldata decode utilities
- `@guardrail/actions` — composable actions (transfer, approve-safe, swap scaffolding)
- `@guardrail/ui-react` — optional React components (future)

## 5-minute integration (Node)

```bash
npm i @guardrail-sdk/core @guardrail-sdk/evm @guardrail-sdk/actions viem
```

```ts
import { createGuardrail, createPolicyEngine, fileAudit } from "@guardrail-sdk/core";
import { createActionPlanner, actions } from "@guardrail-sdk/actions";
import { createEvmClients, createEvmExecutor, createEvmSimulator, createEvmRiskAnalyzer } from "@guardrail-sdk/evm";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

const chain = base;
const chainId = chain.id;

const clients = createEvmClients({
  chain,
  rpcUrl: process.env.RPC_URL!,
  account: privateKeyToAccount(process.env.PRIVATE_KEY!)
});

const sdk = createGuardrail({
  chainId,
  planner: createActionPlanner({ chainId }),
  simulator: createEvmSimulator(clients),
  executor: createEvmExecutor(clients),
  riskAnalyzer: createEvmRiskAnalyzer(),
  policy: createPolicyEngine({
    noInfiniteApprovals: true,
    // optional: allow only known contracts
    // allowTo: ["0x..."]
  }),
  audit: fileAudit({ dir: "./audit" })
});

const plan = await sdk.plan("erc20.approve", {
  token: "0x...",
  spender: "0x...",
  amount: 123n
});

console.log(plan.explain.summary);
console.log(plan.policy);

// await sdk.execute(plan);
```

## 5-minute integration (React / EIP-1193)

Use the wallet’s injected provider (MetaMask, Coinbase Wallet, etc.):

```ts
import { createEip1193Executor, createEvmClients, createEvmSimulator, createEvmRiskAnalyzer } from "@guardrail-sdk/evm";
import { base } from "viem/chains";

const provider = window.ethereum;

const clients = createEvmClients({
  chain: base,
  rpcUrl: "https://mainnet.base.org", // fallback
  eip1193Provider: provider
});

const executor = createEip1193Executor(provider);
const riskAnalyzer = createEvmRiskAnalyzer();

// Use with createGuardrail({ executor, simulator: createEvmSimulator(clients), riskAnalyzer, ... })
```

## Dev

```bash
npm i
npm run build
npm test
```

## Status

v0.1 scaffold (OSS). Focus: Base/EVM, safe defaults, minimal usable API.
