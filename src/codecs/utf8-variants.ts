import { decodeUtf8 } from "./utf8.js";

export function decodeUtf8Variants(bytes: Uint8Array): string | null {

  const standard = decodeUtf8(bytes);
  if (standard !== null) return standard;

  // CESU-8 and Java modified UTF-8 fallback
  const result: string[] = [];
  let i = 0;

  while (i < bytes.length) {
    const b = bytes[i]!;

    if (b < 0x80) {
      result.push(String.fromCharCode(b));
      i++;
      continue;
    }

    // Java modified UTF-8: C0 80 -> null
    if (b === 0xc0 && i + 1 < bytes.length && bytes[i + 1] === 0x80) {
      result.push("\0");
      i += 2;
      continue;
    }

    // CESU-8: two 3-byte surrogate sequences
    if (
      b === 0xed &&
      i + 5 < bytes.length &&
      (bytes[i + 1]! & 0xf0) === 0xa0 &&
      (bytes[i + 2]! & 0xc0) === 0x80 &&
      bytes[i + 3] === 0xed &&
      (bytes[i + 4]! & 0xf0) === 0xb0 &&
      (bytes[i + 5]! & 0xc0) === 0x80
    ) {
      const high = ((bytes[i + 1]! & 0x0f) << 6) | (bytes[i + 2]! & 0x3f);
      const low = ((bytes[i + 4]! & 0x0f) << 6) | (bytes[i + 5]! & 0x3f);
      const cp = 0x10000 + (high << 10) + low;
      result.push(String.fromCodePoint(cp));
      i += 6;
      continue;
    }

    // Standard multi-byte UTF-8
    let cp: number;
    let seqLen: number;

    if ((b & 0xe0) === 0xc0) {
      seqLen = 2;
      cp = b & 0x1f;
    } else if ((b & 0xf0) === 0xe0) {
      seqLen = 3;
      cp = b & 0x0f;
    } else if ((b & 0xf8) === 0xf0) {
      seqLen = 4;
      cp = b & 0x07;
    } else {
      return null; // Invalid lead byte
    }

    if (i + seqLen > bytes.length) return null;

    for (let j = 1; j < seqLen; j++) {
      const cont = bytes[i + j]!;
      if ((cont & 0xc0) !== 0x80) return null;
      cp = (cp << 6) | (cont & 0x3f);
    }

    // Reject overlong encodings (except C0 80 handled above)
    if (seqLen === 2 && cp < 0x80) return null;
    if (seqLen === 3 && cp < 0x800) return null;
    if (seqLen === 4 && cp < 0x10000) return null;

    // Reject surrogates in standard UTF-8 (they're only valid in CESU-8 pairs above)
    if (cp >= 0xd800 && cp <= 0xdfff) return null;

    // Reject codepoints beyond Unicode maximum
    if (cp > 0x10ffff) return null;

    result.push(String.fromCodePoint(cp));
    i += seqLen;
  }

  return result.join("");
}
