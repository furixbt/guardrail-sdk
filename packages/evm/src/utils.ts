import type { Address, Hex, RiskFlag } from "@guardrail/core";
import { decodeFunctionData, erc20Abi, getAddress, hexToBigInt } from "viem";

const UINT256_MAX = (1n << 256n) - 1n;

export function normalizeAddress(a: string): Address {
  return getAddress(a) as Address;
}

export function detectApprovalRisks(input: { to: Address; data?: Hex }): RiskFlag[] {
  if (!input.data) return [];

  try {
    const decoded = decodeFunctionData({ abi: erc20Abi, data: input.data });
    if (decoded.functionName !== "approve") return [];

    const [, amount] = decoded.args as readonly [Address, bigint];
    if (amount === UINT256_MAX) {
      return [
        {
          code: "evm.approval.infinite",
          severity: "high",
          message: "This transaction sets an infinite ERC-20 allowance (UINT256_MAX).",
          data: { contract: input.to, amount: amount.toString() }
        }
      ];
    }

    // Also flag unusually large approvals (> 1e30) as medium risk.
    if (amount > 10n ** 30n) {
      return [
        {
          code: "evm.approval.large",
          severity: "medium",
          message: "This transaction sets a very large ERC-20 allowance.",
          data: { contract: input.to, amount: amount.toString() }
        }
      ];
    }

    return [];
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
