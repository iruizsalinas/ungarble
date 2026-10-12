import { fixEncodingOneStep } from "./step.js";
import { type FixResult, type ExplanationStep } from "../types.js";
import { MAX_REPAIR_DEPTH, MAX_REPAIR_PASSES } from "../security/budgets.js";
import { ERROR_MESSAGES } from "../security/error-messages.js";

function repair(text: string, depth: number, steps?: ExplanationStep[]): string {
  if (depth > MAX_REPAIR_DEPTH) throw new RangeError(ERROR_MESSAGES.recursion);
  let current = text;
  for (let i = 0; i < MAX_REPAIR_PASSES; i++) {
    const result = fixEncodingOneStep(current, segment => repair(segment, depth + 1));
    if (result.text === current) break;
    if (steps) steps.push(...result.steps);
    current = result.text;
  }
  return current;
}

export function fixEncoding(text: string): string {
  return repair(text, 0);
}

export function fixEncodingAndExplain(text: string): FixResult {
  const allSteps: ExplanationStep[] = [];
  return { text: repair(text, 0, allSteps), steps: allSteps };
}
