import { bytesToIdentityString } from "./lossy.js";

export function restoreByteA0(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(Math.ceil(bytes.length * 1.5));
  let ri = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;

    // C3 + space: a-grave word pattern (French/Portuguese)
    if (b === 0xc3 && i + 1 < bytes.length && bytes[i + 1] === 0x20) {
      const remaining = bytes.subarray(i + 2);
      const graveResult = classifyAGraveContext(remaining);
      if (graveResult === "separate") {
        result[ri++] = 0xc3;
        result[ri++] = 0xa0;
        result[ri++] = 0x20;
        i++;
        continue;
      } else if (graveResult === "attached") {
        result[ri++] = 0xc3;
        result[ri++] = 0xa0;
        i++;
        continue;
      }
    }

    // 2-byte: lead + space -> lead + A0 (skip if preceded by space to avoid spaced-out false positives)
    if (
      (b === 0xc2 || b === 0xc3 || b === 0xc5 || b === 0xce || b === 0xd0 || b === 0xd9) &&
      i + 1 < bytes.length &&
      bytes[i + 1] === 0x20 &&
      (i === 0 || bytes[i - 1] !== 0x20)
    ) {
      result[ri++] = b;
      result[ri++] = 0xa0;
      i++; // skip the space
      continue;
    }

    // 3-byte: lead + space + continuation -> lead + A0 + continuation
    if (
      b >= 0xe0 && b <= 0xef &&
      i + 2 < bytes.length &&
      bytes[i + 1] === 0x20 &&
      (bytes[i + 2]! & 0xc0) === 0x80
    ) {
      result[ri++] = b;
      result[ri++] = 0xa0;
      i++; // skip the space
      continue;
    }

    // 3-byte: E0 + continuation + space -> E0 + continuation + A0.
    // Also accept E2 9A for the common damaged warning-sign sequence. Other
    // E1-EF prefixes would produce too many CJK false positives.
    if (
      (b === 0xe0 || (b === 0xe2 && bytes[i + 1] === 0x9a)) &&
      i + 2 < bytes.length &&
      (bytes[i + 1]! & 0xc0) === 0x80 &&
      bytes[i + 2] === 0x20
    ) {
      result[ri++] = b;
      result[ri++] = bytes[i + 1]!;
      result[ri++] = 0xa0;
      i += 2; // skip continuation + space
      continue;
    }

    // 4-byte: F0 + space + continuation + continuation
    if (
      b === 0xf0 &&
      i + 3 < bytes.length &&
      bytes[i + 1] === 0x20 &&
      (bytes[i + 2]! & 0xc0) === 0x80 &&
      (bytes[i + 3]! & 0xc0) === 0x80
    ) {
      result[ri++] = b;
      result[ri++] = 0xa0;
      i++; // skip the space
      continue;
    }

    result[ri++] = b;
  }

  return result.subarray(0, ri);
}

export function classifyAGraveContext(remaining: Uint8Array): "separate" | "attached" | "none" {
  const preview = bytesToIdentityString(remaining.subarray(0, Math.min(20, remaining.length)));

  // Portuguese contractions (no space needed)
  if (/^(?:s[\s,;.!?)]|s$|quele|quela|quilo)/i.test(preview)) return "attached";

  // French (space separator needed)
  if (/^(?:la |les |l'|d'|une? |cette |celui |celle |n'|qu'|jusqu'|lorsqu'|puisqu'|quoiqu'|quelqu'|aujourd'|entr'|presqu')/i.test(preview)) return "separate";

  if (preview.length > 0 && !/^\s/.test(preview) && !/^[A-Z] /.test(preview)) return "separate";

  return "none";
}
