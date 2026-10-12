import { type ChunkingConfig } from "./types.js";
import { extendSurrogateBoundary, extendMojibakeBoundary, extendMojibakeTokenBoundary } from "./unicode.js";
import { extendTerminalEscapeBoundary } from "./escapes.js";
import { extendHtmlEntityBoundary } from "./entities.js";
import { checkBoundaryBudget } from "./budget.js";

import { MAX_BOUNDARY_LOOKAHEAD } from "../security/budgets.js";

export function safeChunkEnd(
  text: string,
  pos: number,
  maxLen: number,
  config: ChunkingConfig,
): number {
  let end = Math.min(pos + maxLen, text.length);
  const limit = Math.min(pos + maxLen + MAX_BOUNDARY_LOOKAHEAD, text.length);

  // Extending for one boundary can expose another one just after it
  // (for example, adjacent HTML entities that decode to one UTF-8 sequence).
  for (let i = 0; i < 4 && end < text.length; i++) {
    const prev = end;
    end = extendSurrogateBoundary(text, end);
    if (config.escapes) {
      end = extendTerminalEscapeBoundary(text, pos, end, limit);
    }
    if (config.html === true) {
      end = extendHtmlEntityBoundary(text, pos, end, limit);
    }
    if (config.encoding) {
      end = extendMojibakeBoundary(text, pos, end, limit);
      end = extendMojibakeTokenBoundary(text, pos, end, limit);
    }
    end = Math.min(end, text.length);
    checkBoundaryBudget(end, limit);
    if (end === prev) break;
  }

  return Math.max(end, pos + 1);
}
