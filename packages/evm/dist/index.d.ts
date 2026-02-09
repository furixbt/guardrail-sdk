import { Executor, Simulator, Address, Hex, RiskFlag } from '@guardrail/core';
import { Chain, Account, createPublicClient, createWalletClient } from 'viem';

type EvmClients = {
    publicClient: ReturnType<typeof createPublicClient>;
    walletClient: ReturnType<typeof createWalletClient>;
};
type CreateEvmRuntimeOptions = {
    chain: Chain;
    rpcUrl: string;
    /** Wallet transport. For Node, you can pass a private-key Account via viem directly later; for now we support EIP-1193. */
    eip1193Provider?: any;
    account?: Account;
};
declare function createEvmClients(opts: CreateEvmRuntimeOptions): EvmClients;
declare function createEvmSimulator(clients: EvmClients): Simulator;
declare function createEvmExecutor(clients: EvmClients): Executor;

declare const PERMIT2_ADDRESS: "0x000000000022D473030F116dDEE9F6B43aC78BA3";
declare function normalizeAddress(a: string): Address;
declare function detectApprovalRisks(input: {
    to: Address;
    data?: Hex;
}): RiskFlag[];
declare function isRevertErrorMessage(err: unknown): string;
declare function safeHexToBigInt(hex?: Hex): bigint | undefined;

export { type CreateEvmRuntimeOptions, type EvmClients, PERMIT2_ADDRESS, createEvmClients, createEvmExecutor, createEvmSimulator, detectApprovalRisks, isRevertErrorMessage, normalizeAddress, safeHexToBigInt };
