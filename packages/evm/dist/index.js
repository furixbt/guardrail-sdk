// src/runtime.ts
import { createPublicClient, createWalletClient, custom, http } from "viem";

// src/utils.ts
import { decodeFunctionData, erc20Abi, getAddress, hexToBigInt } from "viem";
var UINT256_MAX = (1n << 256n) - 1n;
function normalizeAddress(a) {
  return getAddress(a);
}
function detectApprovalRisks(input) {
  if (!input.data) return [];
  try {
    const decoded = decodeFunctionData({ abi: erc20Abi, data: input.data });
    if (decoded.functionName !== "approve") return [];
    const [, amount] = decoded.args;
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
function isRevertErrorMessage(err) {
  if (err && typeof err === "object" && "shortMessage" in err && typeof err.shortMessage === "string") {
    return err.shortMessage;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
function safeHexToBigInt(hex) {
  if (!hex) return void 0;
  try {
    return hexToBigInt(hex);
  } catch {
    return void 0;
  }
}

// src/runtime.ts
function createEvmClients(opts) {
  const transport = opts.rpcUrl ? http(opts.rpcUrl) : custom(opts.eip1193Provider);
  const publicClient = createPublicClient({ chain: opts.chain, transport });
  const walletTransport = opts.eip1193Provider ? custom(opts.eip1193Provider) : http(opts.rpcUrl);
  const walletClient = createWalletClient({ chain: opts.chain, transport: walletTransport, account: opts.account });
  return { publicClient, walletClient };
}
function createEvmSimulator(clients) {
  async function simulateTx(step, _chainId) {
    try {
      const gas = await clients.publicClient.estimateGas({
        to: step.tx.to,
        data: step.tx.data,
        value: step.tx.value
      });
      const ret = await clients.publicClient.call({
        to: step.tx.to,
        data: step.tx.data,
        value: step.tx.value
      });
      return { ok: true, gasEstimate: gas, returnData: ret.data };
    } catch (err) {
      return { ok: false, error: isRevertErrorMessage(err) };
    }
  }
  return { simulateTx };
}
function createEvmExecutor(clients) {
  async function executeTx(step) {
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
    return { txHash: hash };
  }
  return { executeTx };
}
export {
  createEvmClients,
  createEvmExecutor,
  createEvmSimulator,
  detectApprovalRisks,
  isRevertErrorMessage,
  normalizeAddress,
  safeHexToBigInt
};
