import { lastIndexOfFrom, checkBoundaryBudget } from "./budget.js";

export const HTML_ENTITY_FRAGMENT_RE = /^&#?[0-9A-Za-z]{0,24}$/;

export const HTML_ENTITY_COMPLETE_RE = /^&#?[0-9A-Za-z]{1,24};$/;

export const HTML_NUMERIC_TAIL_RE = /^#[0-9A-Za-z]{1,23};$/;

export function readHtmlEntityEnd(text: string, start: number): number | null {
  let semiIndex = -1;
  const semiSearchEnd = Math.min(start + 25, text.length - 1);
  for (let i = start; i <= semiSearchEnd; i++) {
    if (text[i] === ";") {
      semiIndex = i;
      break;
    }
  }
  if (semiIndex === -1) return null;

  const entity = text.slice(start, semiIndex + 1);
  if (!HTML_ENTITY_COMPLETE_RE.test(entity)) return null;

  let end = semiIndex + 1;
  if (entity.toLowerCase() === "&amp;" && text[end] === "#") {
    let nestedSemi = -1;
    const nestedSearchEnd = Math.min(end + 24, text.length - 1);
    for (let i = end; i <= nestedSearchEnd; i++) {
      if (text[i] === ";") {
        nestedSemi = i;
        break;
      }
    }
    if (nestedSemi !== -1) {
      const nested = text.slice(end, nestedSemi + 1);
      if (HTML_NUMERIC_TAIL_RE.test(nested)) {
        end = nestedSemi + 1;
      }
    }
  }

  return end;
}

export function extendHtmlEntityBoundary(text: string, pos: number, end: number, limit: number): number {
  const entityAtStartEnd = readHtmlEntityEnd(text, pos);
  const ampIndex = lastIndexOfFrom(text, "&", end - 1, pos);
  let adjusted = end;
  let endsWithEntity = false;

  if (ampIndex >= pos) {
    const beforeBoundary = text.slice(ampIndex, end);
    if (HTML_ENTITY_FRAGMENT_RE.test(beforeBoundary)) {
      const entityEnd = readHtmlEntityEnd(text, ampIndex);
      if (entityEnd !== null) {
        const previousAmp = text[ampIndex - 1] === ";"
          ? lastIndexOfFrom(text, "&", ampIndex - 2, pos + 1)
          : -1;
        if (
          previousAmp > pos &&
          readHtmlEntityEnd(text, previousAmp) === ampIndex &&
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
    }
  }

  if (!endsWithEntity) return adjusted;

  while (text[adjusted] === "&") {
    const next = readHtmlEntityEnd(text, adjusted);
    if (next === null) break;
    adjusted = next;
    checkBoundaryBudget(adjusted, limit);
  }

  return adjusted;
}
