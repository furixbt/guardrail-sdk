import type { Address, Hex } from "@guardrail-sdk/core";

export type TransferParams = {
  to: Address;
  valueWei: bigint;
};

export type Erc20ApproveParams = {
  token: Address;
  spender: Address;
  amount: bigint;
};

export type Erc20TransferParams = {
  token: Address;
  to: Address;
  amount: bigint;
};

export type SwapParams = {
  // scaffold only for v0.1
  router: Address;
  data: Hex;
  valueWei?: bigint;
  summary: string;
};

export type UniswapUniversalRouterSwapParams = {
  /** Universal Router contract address */
  router: Address;
  /** Prepared calldata (we keep routing out-of-scope for v0.1) */
  data: Hex;
  valueWei?: bigint;
  summary: string;
};

export const transfer = (p: TransferParams) => ({ action: "transfer.native" as const, params: p });
export const erc20Approve = (p: Erc20ApproveParams) => ({ action: "erc20.approve" as const, params: p });

// Alias that encourages safe usage (exact allowance, not UINT256_MAX)
export const approveExact = erc20Approve;
export const erc20Transfer = (p: Erc20TransferParams) => ({ action: "erc20.transfer" as const, params: p });
export const swapRaw = (p: SwapParams) => ({ action: "swap.raw" as const, params: p });
export const swapUniswapUniversalRouterRaw = (p: UniswapUniversalRouterSwapParams) => ({
  action: "swap.uniswap.universalRouterRaw" as const,
  params: p
});
