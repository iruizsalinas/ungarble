import { type UngarbleConfig, DEFAULT_CONFIG } from "../config.js";
import { type ExplanationStep, type FixResult } from "../types.js";
import { enforceInputLimit } from "../security/input-limit.js";
import { fixLineBreaks, fixSurrogates } from "../transforms/unicode.js";
import { recordApplyStep, applyAndRecord } from "./record.js";
import { fixTextLines } from "./segments.js";
import { normalizeSafely } from "../security/normalization.js";

export function _ungarble(text: string, options?: UngarbleConfig, steps?: ExplanationStep[]): string {
  // Optional properties explicitly set to undefined still use their defaults.
  const overrides = Object.fromEntries(
    Object.entries(options ?? {}).filter(([, value]) => value !== undefined),
  );
  const config = { ...DEFAULT_CONFIG, ...overrides };
  enforceInputLimit(text, config.limit);

  if (config.html === "auto") {
    config.html = !text.includes("<");
  }

  let normalized = text;
  if (config.lines) {
    normalized = fixLineBreaks(normalized);
    recordApplyStep(steps, "line_breaks", text, normalized);
  }

  const segmentConfig = { ...config, lines: false, surrogates: false, normalization: false as const };
  let fixed = fixTextLines(normalized, segmentConfig, steps);

  // Entity decoding can introduce line separators after the initial pass.
  if (config.lines) fixed = applyAndRecord(fixed, steps, "line_breaks", fixLineBreaks);

  if (config.surrogates) {
    const before = fixed;
    fixed = fixSurrogates(fixed);
    recordApplyStep(steps, "surrogates", before, fixed);
  }

  if (config.normalization && typeof config.normalization === "string") {
    const before = fixed;
    fixed = normalizeSafely(fixed, config.normalization);
    recordApplyStep(steps, "normalization", before, fixed);
  }

  return fixed;
}

export function _explain(text: string, options?: UngarbleConfig): FixResult {
  const steps: ExplanationStep[] = [];
  const current = _ungarble(text, options, steps);
  return { text: current, steps };
}
