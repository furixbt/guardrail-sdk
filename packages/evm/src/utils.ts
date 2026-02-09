import type { Address, Hex, RiskFlag } from "@guardrail/core";
import { decodeFunctionData, erc20Abi, getAddress, hexToBigInt } from "viem";

const UINT256_MAX = (1n << 256n) - 1n;

// Uniswap Permit2 (same address across EVM chains where deployed)
export const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3" as const;

export function normalizeAddress(a: string): Address {
  return getAddress(a) as Address;
}

export function detectApprovalRisks(input: { to: Address; data?: Hex }): RiskFlag[] {
  if (!input.data) return [];

  try {
    const decoded = decodeFunctionData({ abi: erc20Abi, data: input.data });
    if (decoded.functionName !== "approve") return [];

    const [spender, amount] = decoded.args as readonly [Address, bigint];

    const flags: RiskFlag[] = [];

    if (amount === UINT256_MAX) {
      flags.push({
        code: "evm.approval.infinite",
        severity: "high",
        message: "This transaction sets an infinite ERC-20 allowance (UINT256_MAX).",
        data: { contract: input.to, spender, amount: amount.toString() }
      });
    } else if (amount > 10n ** 30n) {
      // Also flag unusually large approvals (> 1e30) as medium risk.
      flags.push({
        code: "evm.approval.large",
        severity: "medium",
        message: "This transaction sets a very large ERC-20 allowance.",
        data: { contract: input.to, spender, amount: amount.toString() }
      });
    }

    if (spender.toLowerCase() === PERMIT2_ADDRESS.toLowerCase()) {
      flags.push({
        code: "evm.approval.permit2",
        severity: "medium",
        message: "This approval targets Permit2. This is common (Uniswap), but review carefully.",
        data: { contract: input.to, spender }
      });
    }

    return flags;
  } catch {
    return [];
  }
}

export function isRevertErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "shortMessage" in err && typeof (err as any).shortMessage === "string") {
    return (err as any).shortMessage;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export function safeHexToBigInt(hex?: Hex): bigint | undefined {
  if (!hex) return undefined;
  try {
    return hexToBigInt(hex);
  } catch {
    return undefined;
  }
}
