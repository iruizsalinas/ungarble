import { type ExplanationStep } from "../types.js";

export function recordApplyStep(
  steps: ExplanationStep[] | undefined,
  detail: string,
  before: string,
  after: string,
): void {
  if (steps && after !== before) {
    steps.push({ action: "apply", detail });
  }
}

export function applyAndRecord(
  current: string,
  steps: ExplanationStep[] | undefined,
  detail: string,
  fix: (text: string) => string,
): string {
  const fixed = fix(current);
  recordApplyStep(steps, detail, current, fixed);
  return fixed;
}
