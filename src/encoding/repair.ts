import { fixEncodingOneStep } from "./step.js";
import { type FixResult, type ExplanationStep } from "../types.js";
import { MAX_REPAIR_DEPTH, MAX_REPAIR_PASSES, type WorkBudget, createWorkBudget, startPass } from "../security/budgets.js";
import { ERROR_MESSAGES } from "../security/error-messages.js";

function repair(text: string, depth: number, budget: WorkBudget, steps?: ExplanationStep[]): string {
  if (depth > MAX_REPAIR_DEPTH) throw new RangeError(ERROR_MESSAGES.recursion);
  let current = text;
  for (let i = 0; i < MAX_REPAIR_PASSES && startPass(budget, i, current.length); i++) {
    const result = fixEncodingOneStep(current, segment => repair(segment, depth + 1, budget));
    if (result.text === current) break;
    if (steps) steps.push(...result.steps);
    current = result.text;
  }
  return current;
}

export function fixEncoding(text: string): string {
  return repair(text, 0, createWorkBudget(text.length));
}

/** Pipeline entry point: shares the caller's work budget across its passes. */
export function fixEncodingWithin(text: string, budget: WorkBudget): string {
  return repair(text, 0, budget);
}

export function fixEncodingAndExplain(text: string, budget = createWorkBudget(text.length)): FixResult {
  const allSteps: ExplanationStep[] = [];
  return { text: repair(text, 0, budget, allSteps), steps: allSteps };
}
