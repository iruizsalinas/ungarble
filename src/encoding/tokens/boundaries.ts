import { utf8MojibakeSequenceLengthAt, isUtf8MojibakeByteChar } from "../../detection/utf8-sequences.js";

export const TOKEN_BOUNDARY_RE = /[\s"'`()[\]{}<>&|\\/:;!?]/u;

export const COMMON_MOJIBAKE_LEADS_BEFORE_QUOTES = new Set([
  0x00c2, 0x00c3, 0x00c5, 0x00cb, 0x00ce, 0x00d0, 0x00d8, 0x00d9, 0x00e2,
]);

export function isTokenBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  const code = text.charCodeAt(index);
  const adjacentReplacement = [text[index - 1], text[index + 1]]
    .some((char) => char?.codePointAt(0) === 0xfffd);
  const quoteLike = (code >= 0x2018 && code <= 0x201f) || code === 0x2039 || code === 0x203a;
  let quoteCompletesMojibake = false;
  if (quoteLike) {
    for (let start = Math.max(0, index - 3); start <= index; start++) {
      const length = utf8MojibakeSequenceLengthAt(text, start);
      if (
        COMMON_MOJIBAKE_LEADS_BEFORE_QUOTES.has(text.charCodeAt(start)) &&
        length > 0 &&
        start + length === index + 1
      ) {
        quoteCompletesMojibake = true;
        break;
      }
    }
  }
  return (
    code <= 0x20 ||
    code === 0x7f ||
    code === 0x2026 ||
    (quoteLike && !adjacentReplacement && !quoteCompletesMojibake) ||
    (code >= 0x80 && code <= 0x9f) ||
    (code > 0x052f && code !== 0xfffd && !isUtf8MojibakeByteChar(text[index])) ||
    TOKEN_BOUNDARY_RE.test(text[index]!)
  );
}

export function isMojibakeMatchBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  return isTokenBoundary(text, index) || /[.,]/u.test(text[index]!);
}

export function hasWordAfterAdjacentPunctuation(text: string, index: number): boolean {
  let sawPunctuation = false;
  for (let i = index; i < text.length; i++) {
    const char = text[i]!;
    if (/[\s"'`()[\]{}<>&|\\/:;!?]/u.test(char)) return false;
    if (/[.,\u2026]/u.test(char)) {
      sawPunctuation = true;
      continue;
    }
    return sawPunctuation && /[\p{L}\p{N}]/u.test(char);
  }
  return false;
}
