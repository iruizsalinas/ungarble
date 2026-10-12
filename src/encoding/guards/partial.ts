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

// An English possessive or contraction after an accented capital looks like
// UTF-8 mojibake, because the right single quote is Windows-1252 byte 0x92.
// Before any other letter, such a pair is usually mojibake for O-grave or OE.
export const CURLY_CONTRACTION_RE = /\p{L}\u2019(?:s|t|d|m|re|ve|ll)(?![\p{L}\p{N}])/iu;

export function isCurlyPossessiveMatch(text: string, matchIndex: number, matchText: string): boolean {
  if (!matchText.endsWith("\u2019")) return false;
  const end = matchIndex + matchText.length;
  return CURLY_CONTRACTION_RE.test(text.slice(end - 2, end + 3));
}

/** A replacement character inside a multi-byte match proves lost bytes. */
export function hasReplacementSignal(text: string): boolean {
  return text.length >= 3 && text.includes("\ufffd");
}

/**
 * Inside running text, a space may only stand in for a lost NBSP byte when a
 * replacement character beside the match shows the byte stream was damaged.
 */
export function hasLossySignal(text: string, index: number, match: string): boolean {
  if (hasReplacementSignal(match)) return true;
  return match.length >= 3 && match.includes(" ") &&
    (text[index - 1] === "\ufffd" || text[index + match.length] === "\ufffd");
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
