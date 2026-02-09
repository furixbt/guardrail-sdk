import { Planner, Address, Hex } from '@guardrail-sdk/core';

type GuardrailActionPlannerOptions = {
    chainId: number;
};
declare function createActionPlanner(opts: GuardrailActionPlannerOptions): Planner;

type TransferParams = {
    to: Address;
    valueWei: bigint;
};
type Erc20ApproveParams = {
    token: Address;
    spender: Address;
    amount: bigint;
};
type Erc20TransferParams = {
    token: Address;
    to: Address;
    amount: bigint;
};
type SwapParams = {
    router: Address;
    data: Hex;
    valueWei?: bigint;
    summary: string;
};
type UniswapUniversalRouterSwapParams = {
    /** Universal Router contract address */
    router: Address;
    /** Prepared calldata (we keep routing out-of-scope for v0.1) */
    data: Hex;
    valueWei?: bigint;
    summary: string;
};
declare const transfer: (p: TransferParams) => {
    action: "transfer.native";
    params: TransferParams;
};
declare const erc20Approve: (p: Erc20ApproveParams) => {
    action: "erc20.approve";
    params: Erc20ApproveParams;
};
declare const approveExact: (p: Erc20ApproveParams) => {
    action: "erc20.approve";
    params: Erc20ApproveParams;
};
declare const erc20Transfer: (p: Erc20TransferParams) => {
    action: "erc20.transfer";
    params: Erc20TransferParams;
};
declare const swapRaw: (p: SwapParams) => {
    action: "swap.raw";
    params: SwapParams;
};
declare const swapUniswapUniversalRouterRaw: (p: UniswapUniversalRouterSwapParams) => {
    action: "swap.uniswap.universalRouterRaw";
    params: UniswapUniversalRouterSwapParams;
};

type ops_Erc20ApproveParams = Erc20ApproveParams;
type ops_Erc20TransferParams = Erc20TransferParams;
type ops_SwapParams = SwapParams;
type ops_TransferParams = TransferParams;
type ops_UniswapUniversalRouterSwapParams = UniswapUniversalRouterSwapParams;
declare const ops_approveExact: typeof approveExact;
declare const ops_erc20Approve: typeof erc20Approve;
declare const ops_erc20Transfer: typeof erc20Transfer;
declare const ops_swapRaw: typeof swapRaw;
declare const ops_swapUniswapUniversalRouterRaw: typeof swapUniswapUniversalRouterRaw;
declare const ops_transfer: typeof transfer;
declare namespace ops {
  export { type ops_Erc20ApproveParams as Erc20ApproveParams, type ops_Erc20TransferParams as Erc20TransferParams, type ops_SwapParams as SwapParams, type ops_TransferParams as TransferParams, type ops_UniswapUniversalRouterSwapParams as UniswapUniversalRouterSwapParams, ops_approveExact as approveExact, ops_erc20Approve as erc20Approve, ops_erc20Transfer as erc20Transfer, ops_swapRaw as swapRaw, ops_swapUniswapUniversalRouterRaw as swapUniswapUniversalRouterRaw, ops_transfer as transfer };
}

export { type GuardrailActionPlannerOptions, ops as actions, createActionPlanner };
