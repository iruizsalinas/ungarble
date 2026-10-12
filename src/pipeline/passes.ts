import { type UngarbleConfig } from "../config.js";
import { type ExplanationStep } from "../types.js";
import { applyAndRecord, recordApplyStep } from "./record.js";
import { unescapeHtml } from "../transforms/html.js";
import { removeTerminalEscapes } from "../transforms/escapes.js";
import { fixEncodingAndExplain, fixEncoding } from "../encoding/repair.js";
import { fixC1Controls } from "../transforms/c1.js";
import { fixLatinLigatures, fixCharacterWidth, uncurlQuotes } from "../transforms/characters.js";
import { fixLineBreaks, fixSurrogates, removeControlChars } from "../transforms/unicode.js";
import { normalizeSafely } from "../security/normalization.js";
import { needsAnotherPipelinePass } from "./signals.js";

import { MAX_REPAIR_PASSES } from "../security/budgets.js";

export function applyFixPipeline(
  text: string,
  config: Required<UngarbleConfig>,
  steps?: ExplanationStep[],
): string {
  let current = text;

  let shouldHtml = false;
  if (config.html === true) {
    shouldHtml = true;
  } else if (config.html === "auto") {
    shouldHtml = !current.includes("<");
  }

  for (let iteration = 0; iteration < MAX_REPAIR_PASSES; iteration++) {
    const prev = current;

    if (shouldHtml) {
      current = applyAndRecord(current, steps, "html", unescapeHtml);
    }

    if (config.escapes) {
      current = applyAndRecord(current, steps, "terminal_escapes", removeTerminalEscapes);
    }

    if (config.encoding) {
      if (steps) {
        const result = fixEncodingAndExplain(current);
        current = result.text;
        steps.push(...result.steps);
      } else {
        current = fixEncoding(current);
      }
    }

    if (config.c1) {
      current = applyAndRecord(current, steps, "fix_c1_controls", fixC1Controls);
    }

    if (config.ligatures) {
      current = applyAndRecord(current, steps, "ligatures", fixLatinLigatures);
    }

    if (config.width) {
      current = applyAndRecord(current, steps, "width", fixCharacterWidth);
    }

    if (config.quotes) {
      current = applyAndRecord(current, steps, "quotes", uncurlQuotes);
    }

    if (config.lines) {
      current = applyAndRecord(current, steps, "line_breaks", fixLineBreaks);
    }

    if (config.surrogates) {
      current = applyAndRecord(current, steps, "surrogates", fixSurrogates);
    }

    if (config.escapes) {
      current = applyAndRecord(current, steps, "terminal_escapes", removeTerminalEscapes);
    }

    if (config.controls) {
      current = applyAndRecord(current, steps, "controls", removeControlChars);
    }

    if (config.normalization && typeof config.normalization === "string") {
      const before = current;
      current = normalizeSafely(current, config.normalization);
      recordApplyStep(steps, "normalization", before, current);
    }

    if (current === prev) break;
    if (!needsAnotherPipelinePass(current, config, shouldHtml)) break;
  }

  return current;
}
