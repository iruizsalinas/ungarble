import { lastIndexOfFrom, checkBoundaryBudget } from "./budget.js";

export const HTML_ENTITY_COMPLETE_RE = /^&#?[0-9A-Za-z]{1,24};$/;

// The text after a decoded "&" that completes another entity.
export const HTML_ENTITY_TAIL_RE = /^#?[0-9A-Za-z]{1,24};/;

// Entities that decode to "&". Decoding finishes an escaped-again chain such
// as &amp;amp;lt; in one step, so the whole chain belongs in one chunk.
const AMPERSAND_ENTITY_RE = /^&(?:amp|#0*38|#x0*26);$/i;

/** End of the entity at start, including any escaped-again chain up to limit. */
export function readHtmlEntityEnd(text: string, start: number, limit = text.length): number | null {
  let semiIndex = -1;
  const semiSearchEnd = Math.min(start + 25, text.length - 1);
  for (let i = start; i <= semiSearchEnd; i++) {
    if (text[i] === ";") {
      semiIndex = i;
      break;
    }
  }
  if (semiIndex === -1) return null;

  let entity = text.slice(start, semiIndex + 1);
  if (!HTML_ENTITY_COMPLETE_RE.test(entity)) return null;

  let end = semiIndex + 1;
  while (AMPERSAND_ENTITY_RE.test(entity)) {
    const tail = HTML_ENTITY_TAIL_RE.exec(text.slice(end, end + 26));
    if (tail === null || end + tail[0].length > limit) break;
    entity = "&" + tail[0];
    end += tail[0].length;
  }

  return end;
}

export function extendHtmlEntityBoundary(text: string, pos: number, end: number, limit: number): number {
  const entityAtStartEnd = readHtmlEntityEnd(text, pos, limit);
  const ampIndex = lastIndexOfFrom(text, "&", end - 1, pos);
  let adjusted = end;
  let endsWithEntity = false;

  // An entity, or an escaped-again chain, starts before the boundary and ends
  // after it. Chain tails contain no "&", so ampIndex is where it starts.
  const entityEnd = ampIndex >= pos ? readHtmlEntityEnd(text, ampIndex, limit) : null;
  if (entityEnd !== null && entityEnd > end) {
    const previousAmp = text[ampIndex - 1] === ";"
      ? lastIndexOfFrom(text, "&", ampIndex - 2, pos + 1)
      : -1;
    if (
      previousAmp > pos &&
      readHtmlEntityEnd(text, previousAmp, limit) === ampIndex &&
      entityAtStartEnd !== previousAmp
    ) {
      return previousAmp;
    }
    if (ampIndex > pos && entityAtStartEnd !== ampIndex) {
      return ampIndex;
    }
    adjusted = entityEnd;
    endsWithEntity = true;
  }

  if (!endsWithEntity) return adjusted;

  while (text[adjusted] === "&") {
    const next = readHtmlEntityEnd(text, adjusted, limit);
    if (next === null) break;
    adjusted = next;
    checkBoundaryBudget(adjusted, limit);
  }

  return adjusted;
}
