import { utf8MojibakeSequenceLengthAt, isUtf8MojibakeByteChar, isLatinExtendedAdditional } from "../detection/utf8-sequences.js";
import { checkBoundaryBudget } from "./budget.js";

export const TOKEN_BOUNDARY_RE = /[\s"'`()[\]{}<>&|\\/:;!?]/u;

export function extendSurrogateBoundary(text: string, end: number): number {
  if (end <= 0 || end >= text.length) return end;
  const prev = text.charCodeAt(end - 1);
  const next = text.charCodeAt(end);
  if (prev >= 0xd800 && prev <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) {
    return end + 1;
  }
  return end;
}

export function extendMojibakeBoundary(text: string, pos: number, end: number, limit: number): number {
  let adjusted = end;
  const start = Math.max(pos, adjusted - 3);
  for (let index = start; index < adjusted; index++) {
    const length = utf8MojibakeSequenceLengthAt(text, index);
    if (length > 0 && index + length > adjusted) {
      adjusted = index + length;
      checkBoundaryBudget(adjusted, limit);
    }
  }
  return adjusted;
}

export function hasRecentMojibakeSequence(text: string, pos: number, end: number): boolean {
  const start = Math.max(pos, end - 16);
  for (let index = start; index < end; index++) {
    if (utf8MojibakeSequenceLengthAt(text, index) > 0) return true;
  }
  return false;
}

export function isTokenBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  const code = text.charCodeAt(index);
  return (
    code <= 0x20 ||
    code === 0x7f ||
    code === 0x2026 ||
    (code > 0x052f && !isLatinExtendedAdditional(code) && !isUtf8MojibakeByteChar(text[index])) ||
    TOKEN_BOUNDARY_RE.test(text[index]!)
  );
}

export function extendMojibakeTokenBoundary(text: string, pos: number, end: number, limit: number): number {
  if (
    end >= text.length ||
    isTokenBoundary(text, end - 1) ||
    isTokenBoundary(text, end) ||
    !hasRecentMojibakeSequence(text, pos, end)
  ) {
    return end;
  }

  let adjusted = end;
  while (adjusted < text.length && !isTokenBoundary(text, adjusted)) {
    adjusted++;
    checkBoundaryBudget(adjusted, limit);
  }
  return adjusted;
}
