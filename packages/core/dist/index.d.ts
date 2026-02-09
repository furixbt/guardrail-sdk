import { z } from 'zod';

type ChainId = number;
type Hex = `0x${string}`;
type Address = `0x${string}`;
type Bigintish = bigint | number | string;
type Severity = "low" | "medium" | "high";
type RiskFlag = {
    code: string;
    severity: Severity;
    message: string;
    data?: unknown;
};
type Explain = {
    title: string;
    summary: string;
    bullets?: string[];
};
type TxRequest = {
    to: Address;
    data?: Hex;
    value?: bigint;
};
type TxSimulation = {
    ok: boolean;
    gasEstimate?: bigint;
    returnData?: Hex;
    error?: string;
};
type PlanStep = {
    kind: "tx";
    tx: TxRequest;
    explain?: Explain;
    riskFlags?: RiskFlag[];
    simulation?: TxSimulation;
};
type Plan = {
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
type PolicyDecision = {
    allowed: boolean;
    violations: RiskFlag[];
};
type PolicyEngine = {
    evaluatePlan(plan: Omit<Plan, "policy">): PolicyDecision;
};
type AuditWriter = {
    writePlan(plan: Plan): Promise<void>;
    writeExecution(planId: string, data: unknown): Promise<void>;
};
type ApproverRequest = {
    plan: Plan;
    summary: string;
};
type Approver = {
    /** Return true to approve execution. */
    approve(req: ApproverRequest): Promise<boolean>;
};
type RiskAnalyzer = {
    analyzeStep(step: PlanStep, chainId: ChainId): Promise<RiskFlag[]>;
};
type Simulator = {
    simulateTx(step: PlanStep, chainId: ChainId): Promise<TxSimulation>;
};
type Executor = {
    executeTx(step: PlanStep, chainId: ChainId): Promise<{
        txHash: Hex;
    }>;
};
type Planner = {
    plan(input: {
        chainId: ChainId;
        action: string;
        params: Record<string, unknown>;
    }): Promise<Omit<Plan, "policy">>;
};

declare const PolicySchema: z.ZodObject<{
    maxValueWeiPerTx: z.ZodOptional<z.ZodBigInt>;
    noInfiniteApprovals: z.ZodDefault<z.ZodBoolean>;
    allowTo: z.ZodOptional<z.ZodArray<z.ZodString>>;
    denyTo: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requireApprovalAboveValueWei: z.ZodOptional<z.ZodBigInt>;
}, z.core.$strict>;
type Policy = z.infer<typeof PolicySchema>;
declare function createPolicyEngine(policy: Policy): PolicyEngine;

type FileAuditOptions = {
    dir: string;
};
declare function fileAudit(opts: FileAuditOptions): AuditWriter;

type GuardrailSDK = {
    plan(action: string, params: Record<string, unknown>): Promise<Plan>;
    execute(plan: Plan): Promise<{
        planId: string;
        receipts: Array<{
            txHash: `0x${string}`;
        }>;
    }>;
};
type CreateGuardrailOptions = {
    chainId: number;
    planner: Planner;
    simulator: Simulator;
    executor: Executor;
    policy: PolicyEngine;
    riskAnalyzer?: RiskAnalyzer;
    audit?: AuditWriter;
    approver?: Approver;
};
declare function createGuardrail(opts: CreateGuardrailOptions): GuardrailSDK;

export { type Address, type Approver, type ApproverRequest, type AuditWriter, type Bigintish, type ChainId, type CreateGuardrailOptions, type Executor, type Explain, type FileAuditOptions, type GuardrailSDK, type Hex, type Plan, type PlanStep, type Planner, type Policy, type PolicyDecision, type PolicyEngine, PolicySchema, type RiskAnalyzer, type RiskFlag, type Severity, type Simulator, type TxRequest, type TxSimulation, createGuardrail, createPolicyEngine, fileAudit };
