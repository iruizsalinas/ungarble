import { utf8First4Chars, utf8First3Chars, utf8First2Chars, utf8ContChars } from "./byte-sets.js";

export function utf8MojibakeSequenceLengthAt(text: string, index: number): number {
  const first = text.codePointAt(index);
  if (first === undefined) return 0;

  for (const [length, leadChars] of [
    [4, utf8First4Chars],
    [3, utf8First3Chars],
    [2, utf8First2Chars],
  ] as const) {
    if (!leadChars.has(first) || index + length > text.length) continue;

    let valid = true;
    for (let offset = 1; offset < length; offset++) {
      const cp = text.codePointAt(index + offset);
      if (cp === undefined || !utf8ContChars.has(cp)) {
        valid = false;
        break;
      }
    }

    if (valid) return length;
  }

  return 0;
}

/** Latin Extended Additional letters (Vietnamese, Yoruba) are word characters. */
export function isLatinExtendedAdditional(code: number): boolean {
  return code >= 0x1e00 && code <= 0x1eff;
}

export function isUtf8MojibakeByteChar(char: string | undefined): boolean {
  if (char === undefined) return false;
  const cp = char.codePointAt(0);
  if (cp === undefined) return false;
  return utf8ContChars.has(cp) || utf8First2Chars.has(cp) || utf8First3Chars.has(cp) || utf8First4Chars.has(cp);
}

export function isUtf8MojibakeLeadChar(char: string | undefined): boolean {
  if (char === undefined) return false;
  const cp = char.codePointAt(0);
  return cp !== undefined && (
    utf8First2Chars.has(cp) ||
    utf8First3Chars.has(cp) ||
    utf8First4Chars.has(cp)
  );
}
