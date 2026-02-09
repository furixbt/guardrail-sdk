import type { Executor, Hex, PlanStep, Simulator, TxSimulation } from "@guardrail/core";
import { createPublicClient, createWalletClient, custom, http, type Account, type Chain, type Transport } from "viem";

import { isRevertErrorMessage } from "./utils";

export type EvmClients = {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
};

export type CreateEvmRuntimeOptions = {
  chain: Chain;
  rpcUrl: string;
  /** Wallet transport. For Node, you can pass a private-key Account via viem directly later; for now we support EIP-1193. */
  eip1193Provider?: any;
  account?: Account;
};

export function createEvmClients(opts: CreateEvmRuntimeOptions): EvmClients {
  const transport: Transport = opts.rpcUrl ? http(opts.rpcUrl) : custom(opts.eip1193Provider);

  const publicClient = createPublicClient({ chain: opts.chain, transport });

  const walletTransport: Transport = opts.eip1193Provider ? custom(opts.eip1193Provider) : http(opts.rpcUrl);
  const walletClient = createWalletClient({ chain: opts.chain, transport: walletTransport, account: opts.account });

  return { publicClient, walletClient };
}

export function createEvmSimulator(clients: EvmClients): Simulator {
  async function simulateTx(step: PlanStep, _chainId: number): Promise<TxSimulation> {
    try {
      const gas = await clients.publicClient.estimateGas({
        to: step.tx.to,
        data: step.tx.data,
        value: step.tx.value
      });

      // Try eth_call for return data (best-effort)
      const ret = await clients.publicClient.call({
        to: step.tx.to,
        data: step.tx.data,
        value: step.tx.value
      });

      return { ok: true, gasEstimate: gas, returnData: ret.data as Hex };
    } catch (err) {
      return { ok: false, error: isRevertErrorMessage(err) };
    }
  }

  return { simulateTx };
}

export function createEvmExecutor(clients: EvmClients): Executor {
  async function executeTx(step: PlanStep): Promise<{ txHash: Hex }> {
    if (!clients.walletClient.account) {
      throw new Error(
        "No wallet account configured for executor. Provide `account` (private key) or an EIP-1193 provider in createEvmClients()."
      );
    }

    const hash = await clients.walletClient.sendTransaction({
      account: clients.walletClient.account,
      chain: clients.walletClient.chain,
      to: step.tx.to,
      data: step.tx.data,
      value: step.tx.value
    });

    return { txHash: hash as Hex };
  }

  return { executeTx };
}
