import { isTokenBoundary } from "./boundaries.js";
import { isUtf8MojibakeByteChar } from "../../detection/utf8-sequences.js";
import { isBad } from "../../detection/badness.js";

// Detector matches arrive in order. Scan each boundary at most once per pass,
// including when an unchanged token contains many separate detector matches.
export function tokenReader(text: string) {
  let scannedStart = 0;
  let tokenStart = 0;
  let tokenEnd = 0;
  let cached: { start: number; end: number; text: string; bad: boolean; damaged: boolean } | undefined;
  return (start: number, end: number) => {
    while (scannedStart < start) {
      if (isTokenBoundary(text, scannedStart)) tokenStart = scannedStart + 1;
      scannedStart++;
    }
    tokenEnd = Math.max(tokenEnd, end);
    while (tokenEnd < text.length && !isTokenBoundary(text, tokenEnd)) tokenEnd++;
    if (!cached || cached.start !== tokenStart || cached.end !== tokenEnd) {
      const token = text.slice(tokenStart, tokenEnd);
      const damageEdges = [token[0], token[token.length - 1]].every((char) =>
        char?.codePointAt(0) === 0xfffd || isUtf8MojibakeByteChar(char)
      );
      cached = {
        start: tokenStart, end: tokenEnd, text: token, bad: isBad(token),
        damaged: damageEdges && (token.includes("\ufffd") || !/[A-Za-z0-9]/u.test(token)),
      };
    }
    return cached;
  };
}

export function hasSpacedInitialsBefore(text: string, end: number): boolean {
  // Two trailing initials suffice: the separator before them is itself a
  // valid whitespace boundary. No search/backtracking through the prefix.
  if (end < 4 || text[end - 1] !== " " || text[end - 3] !== " ") return false;
  const a = text.charCodeAt(end - 4);
  const b = text.charCodeAt(end - 2);
  return a >= 65 && a <= 90 && b >= 65 && b <= 90 &&
    (end === 4 || /\s/u.test(text[end - 5]!));
}
