# Guardrail

Safe-by-default **Agent Wallet SDK** for EVM.

Core idea: **plan → explain → simulate → policy-check → (optional human approval) → execute**, with deterministic audit logs.

## Packages

- `@guardrail/core` — planning, policy engine, audit trail, approvals
- `@guardrail/evm` — EVM adapter (Base-first), simulation + calldata decode utilities
- `@guardrail/actions` — composable actions (transfer, approve-safe, swap scaffolding)
- `@guardrail/ui-react` — optional React components (future)

## Dev

```bash
npm i
npm run build
```

## Status

Early scaffold (v0.1). Focus: Base/EVM, safe defaults, minimal usable API.
