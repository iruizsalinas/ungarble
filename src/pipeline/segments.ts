import { type UngarbleConfig, DEFAULT_CONFIG } from "../config.js";
import { type ExplanationStep } from "../types.js";
import { normalizedMaxDecodeLength } from "../chunking/budget.js";
import { applyFixPipeline } from "./passes.js";
import { safeChunkEnd } from "../chunking/boundary.js";
import { needsAnotherChunkPass } from "./signals.js";
import { OSC_TERMINAL_ESCAPE_RE } from "../transforms/escapes.js";

import { MAX_REPAIR_PASSES, createWorkBudget, startPass } from "../security/budgets.js";

export function fixTextSegment(
  text: string,
  config: Required<UngarbleConfig>,
  steps?: ExplanationStep[],
): string {
  const maxLen = normalizedMaxDecodeLength(config.chunk, DEFAULT_CONFIG.chunk);
  // One budget per line bounds the chunk, pipeline and encoding passes together.
  const budget = createWorkBudget(text.length);
  if (text.length <= maxLen) {
    return applyFixPipeline(text, config, steps, budget);
  }

  let current = text;
  for (let iteration = 0; iteration < MAX_REPAIR_PASSES && startPass(budget, iteration, current.length); iteration++) {
    const chunks: string[] = [];
    let pos = 0;
    while (pos < current.length) {
      const end = safeChunkEnd(current, pos, maxLen, config);
      chunks.push(applyFixPipeline(current.slice(pos, end), config, steps, budget));
      pos = end;
    }

    const fixed = chunks.join("");
    if (fixed === current) break;
    current = fixed;

    if (!needsAnotherChunkPass(current, config)) break;

    if (current.length <= maxLen) {
      return applyFixPipeline(current, config, steps, budget);
    }
  }

  return current;
}

/** Avoid allocating a second, whole-input array for newline-heavy input. */
export function fixTextLines(
  text: string, config: Required<UngarbleConfig>, steps?: ExplanationStep[],
): string {
  const lines: string[] = [];
  // OSC payloads can contain newlines. Keep complete sequences together so
  // cleanup sees both delimiters; chunking still enforces its lookahead budget.
  const escapes = config.escapes ? text.matchAll(OSC_TERMINAL_ESCAPE_RE) : undefined;
  let escape = escapes?.next();
  let start = 0;
  for (;;) {
    let newline = text.indexOf("\n", start);
    while (newline !== -1 && escape && !escape.done && escape.value.index <= newline) {
      const escapeEnd = escape.value.index + escape.value[0].length;
      if (escapeEnd > newline) newline = text.indexOf("\n", escapeEnd);
      escape = escapes!.next();
    }
    const end = newline === -1 ? text.length : newline;
    lines.push(fixTextSegment(text.slice(start, end), config, steps));
    if (newline === -1) break;
    start = newline + 1;
  }
  return lines.join("\n");
}
