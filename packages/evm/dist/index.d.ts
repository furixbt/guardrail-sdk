import { Executor, Simulator, Address, Hex, RiskFlag, RiskAnalyzer } from '@guardrail/core';
import { Chain, Account, createPublicClient, createWalletClient } from 'viem';

type EvmClients = {
    publicClient: ReturnType<typeof createPublicClient>;
    walletClient: ReturnType<typeof createWalletClient>;
};
type Eip1193Provider = {
    request: (args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }) => Promise<unknown>;
};
type CreateEvmRuntimeOptions = {
    chain: Chain;
    rpcUrl: string;
    /** EIP-1193 provider (MetaMask, Coinbase Wallet, etc.) */
    eip1193Provider?: Eip1193Provider;
    /** Optional viem Account (e.g. privateKeyToAccount) for server-side execution. */
    account?: Account;
};
declare function createEvmClients(opts: CreateEvmRuntimeOptions): EvmClients;
declare function createEvmSimulator(clients: EvmClients): Simulator;
declare function createEvmExecutor(clients: EvmClients): Executor;
declare function createEip1193Executor(provider: Eip1193Provider): Executor;

declare const PERMIT2_ADDRESS: "0x000000000022D473030F116dDEE9F6B43aC78BA3";
declare function normalizeAddress(a: string): Address;
declare function detectApprovalRisks(input: {
    to: Address;
    data?: Hex;
}): RiskFlag[];
declare function isRevertErrorMessage(err: unknown): string;
declare function safeHexToBigInt(hex?: Hex): bigint | undefined;

type CreateEvmRiskAnalyzerOptions = {
    /** If true, include approval decoding heuristics (approve/infinite/permit2). */
    approvals?: boolean;
};
declare function createEvmRiskAnalyzer(opts?: CreateEvmRiskAnalyzerOptions): RiskAnalyzer;

export { type CreateEvmRiskAnalyzerOptions, type CreateEvmRuntimeOptions, type Eip1193Provider, type EvmClients, PERMIT2_ADDRESS, createEip1193Executor, createEvmClients, createEvmExecutor, createEvmRiskAnalyzer, createEvmSimulator, detectApprovalRisks, isRevertErrorMessage, normalizeAddress, safeHexToBigInt };
