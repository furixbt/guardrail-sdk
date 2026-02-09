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

declare function normalizeAddress(a: string): Address;
declare function detectApprovalRisks(input: {
    to: Address;
    data?: Hex;
}): RiskFlag[];
declare function isRevertErrorMessage(err: unknown): string;
declare function safeHexToBigInt(hex?: Hex): bigint | undefined;

export { type CreateEvmRuntimeOptions, type EvmClients, createEvmClients, createEvmExecutor, createEvmSimulator, detectApprovalRisks, isRevertErrorMessage, normalizeAddress, safeHexToBigInt };
