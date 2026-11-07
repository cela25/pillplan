import type { PlanState } from '@/features/medicines';
import { parsePlan, serializePlan } from './schema';

export type ImportResult = { ok: true; plan: PlanState } | { ok: false };

/** No patient name in the file name, so a downloads folder does not leak it. */
export function exportFileName(now: Date): string {
  return `pillplan-${now.toISOString().slice(0, 10)}.json`;
}

export function exportPlan(plan: PlanState, now: Date): Blob {
  return new Blob([serializePlan(plan, now)], { type: 'application/json' });
}

export function importPlan(text: string): ImportResult {
  try {
    const plan = parsePlan(JSON.parse(text));
    return plan ? { ok: true, plan } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
