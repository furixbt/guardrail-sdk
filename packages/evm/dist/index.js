// src/runtime.ts
import { createPublicClient, createWalletClient, custom, http } from "viem";

// src/utils.ts
import { decodeFunctionData, erc20Abi, getAddress, hexToBigInt } from "viem";
var UINT256_MAX = (1n << 256n) - 1n;
var PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
function normalizeAddress(a) {
  return getAddress(a);
}
function detectApprovalRisks(input) {
  if (!input.data) return [];
  try {
    const decoded = decodeFunctionData({ abi: erc20Abi, data: input.data });
    if (decoded.functionName !== "approve") return [];
    const [spender, amount] = decoded.args;
    const flags = [];
    if (amount === UINT256_MAX) {
      flags.push({
        code: "evm.approval.infinite",
        severity: "high",
        message: "This transaction sets an infinite ERC-20 allowance (UINT256_MAX).",
        data: { contract: input.to, spender, amount: amount.toString() }
      });
    } else if (amount > 10n ** 30n) {
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
        "No wallet account configured for executor. Provide `account` (private key) in createEvmClients(), or use createEip1193Executor() for browser wallets."
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
function createEip1193Executor(provider) {
  async function executeTx(step) {
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    const from = accounts?.[0];
    if (!from) throw new Error("No account available from EIP-1193 provider.");
    const tx = {
      from,
      to: step.tx.to,
      data: step.tx.data,
      value: step.tx.value ? `0x${step.tx.value.toString(16)}` : void 0
    };
    const hash = await provider.request({ method: "eth_sendTransaction", params: [tx] });
    return { txHash: hash };
  }
  return { executeTx };
}

// src/risk.ts
function createEvmRiskAnalyzer(opts = {}) {
  const approvals = opts.approvals ?? true;
  async function analyzeStep(step) {
    if (!approvals) return [];
    if (step.kind !== "tx") return [];
    return detectApprovalRisks({ to: step.tx.to, data: step.tx.data });
  }
  return { analyzeStep };
}
export {
  PERMIT2_ADDRESS,
  createEip1193Executor,
  createEvmClients,
  createEvmExecutor,
  createEvmRiskAnalyzer,
  createEvmSimulator,
  detectApprovalRisks,
  isRevertErrorMessage,
  normalizeAddress,
  safeHexToBigInt
};
