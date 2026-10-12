import { hasC1ByteChar, isSingleAmbiguousLatinChar, isNonAsciiMojibakeByteChar } from "./characters.js";
import { utf8MojibakeSequenceLengthAt } from "../../detection/utf8-sequences.js";

export function isAmbiguousPartialLatinRepair(
  text: string,
  matchIndex: number,
  matchText: string,
  decoded: string,
): boolean {
  if (matchText.length < 2 || matchText.length > 3 || hasC1ByteChar(matchText)) return false;
  if (!isSingleAmbiguousLatinChar(decoded)) return false;

  const next = text[matchIndex + matchText.length];
  if (next !== undefined && utf8MojibakeSequenceLengthAt(decoded + next, 0) > 0) {
    return false;
  }

  return (
    isNonAsciiMojibakeByteChar(text[matchIndex - 1]) ||
    isNonAsciiMojibakeByteChar(text[matchIndex + matchText.length])
  );
}

export function isCurlyPossessiveMatch(text: string, matchIndex: number, matchText: string): boolean {
  if (!matchText.endsWith("\u2019")) return false;
  const before = matchText.slice(0, -1);
  const after = text[matchIndex + matchText.length];
  return /\p{L}$/u.test(before) && after !== undefined && /[A-Za-z]/u.test(after);
}

export function countUtf8MojibakeSequences(text: string): number {
  let count = 0;
  for (let index = 0; index < text.length;) {
    const length = utf8MojibakeSequenceLengthAt(text, index);
    if (length > 0) {
      count++;
      index += length;
    } else {
      index++;
    }
  }
  return count;
}
