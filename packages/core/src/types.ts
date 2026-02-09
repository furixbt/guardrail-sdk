export type ChainId = number;

export type Hex = `0x${string}`;

export type Address = `0x${string}`;

export type Bigintish = bigint | number | string;

export type Severity = "low" | "medium" | "high";

export type RiskFlag = {
  code: string;
  severity: Severity;
  message: string;
  data?: unknown;
};

export type Explain = {
  title: string;
  summary: string;
  bullets?: string[];
};

export type TxRequest = {
  to: Address;
  data?: Hex;
  value?: bigint;
};

export type TxSimulation = {
  ok: boolean;
  gasEstimate?: bigint;
  returnData?: Hex;
  error?: string;
};

export type PlanStep = {
  kind: "tx";
  tx: TxRequest;
  explain?: Explain;
  riskFlags?: RiskFlag[];
  simulation?: TxSimulation;
};

export type Plan = {
  id: string;
  createdAt: number;
  chainId: ChainId;
  intent: {
    action: string;
    params: Record<string, unknown>;
  };
  explain: Explain;
  steps: PlanStep[];
  policy: {
    allowed: boolean;
    violations: RiskFlag[];
  };
  meta?: Record<string, unknown>;
};

export type PolicyDecision = {
  allowed: boolean;
  violations: RiskFlag[];
};

export type PolicyEngine = {
  evaluatePlan(plan: Omit<Plan, "policy">): PolicyDecision;
};

export type AuditWriter = {
  writePlan(plan: Plan): Promise<void>;
  writeExecution(planId: string, data: unknown): Promise<void>;
};

export type ApproverRequest = {
  plan: Plan;
  summary: string;
};

export type Approver = {
  /** Return true to approve execution. */
  approve(req: ApproverRequest): Promise<boolean>;
};

export type Simulator = {
  simulateTx(step: PlanStep, chainId: ChainId): Promise<TxSimulation>;
};

export type Executor = {
  executeTx(step: PlanStep, chainId: ChainId): Promise<{ txHash: Hex }>;
};

export type Planner = {
  plan(input: {
    chainId: ChainId;
    action: string;
    params: Record<string, unknown>;
  }): Promise<Omit<Plan, "policy">>;
};
