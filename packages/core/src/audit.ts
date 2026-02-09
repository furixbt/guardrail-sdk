import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type { AuditWriter, Plan } from "./types";

export type FileAuditOptions = {
  dir: string;
};

function stableStringify(obj: unknown): string {
  // Good enough for v0.1; later we can do canonical JSON.
  return JSON.stringify(obj, null, 2);
}

export function fileAudit(opts: FileAuditOptions): AuditWriter {
  const base = opts.dir;

  async function ensureDir(p: string) {
    await mkdir(p, { recursive: true });
  }

  async function writePlan(plan: Plan): Promise<void> {
    const dir = join(base, plan.id);
    await ensureDir(dir);
    await writeFile(join(dir, "plan.json"), stableStringify(plan), "utf8");
  }

  async function writeExecution(planId: string, data: unknown): Promise<void> {
    const dir = join(base, planId);
    await ensureDir(dir);
    await writeFile(join(dir, `execution-${Date.now()}.json`), stableStringify(data), "utf8");
  }

  return { writePlan, writeExecution };
}
