# Contributing

## Ground rules

- Keep changes small and reviewable.
- Default to **safe-by-default** behavior.
- Every new execution capability should have:
  - a planner entry
  - simulation support (at least `estimateGas` + best-effort `eth_call`)
  - policy hooks / risk flags
  - audit output

## Dev setup

```bash
npm i
npm run build
npm test
npm run lint
```

## Repo structure

- `packages/core` — planning types, policy engine, approvals, audit
- `packages/evm` — EVM simulator/executor + decoding helpers
- `packages/actions` — composable actions + planner
- `apps/demo` — minimal demos

## Changesets (releases)

We use Changesets. For user-facing changes:

```bash
npm run changeset
```

Then open a PR.
