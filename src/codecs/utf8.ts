export const utf8Encoder = new TextEncoder();

// `ignoreBOM: true` means "do not use a BOM as a decoding signature" and
// therefore preserves U+FEFF for the caller to handle explicitly. A
// non-streaming decode() resets the decoder, so one instance can be shared.
const utf8Decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

/**
 * Strict UTF-8 validation. Repair tries many candidate byte strings and most
 * are invalid; rejecting them here avoids constructing an exception for each.
 */
export function isValidUtf8(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length;) {
    const lead = bytes[i]!;
    if (lead < 0x80) {
      i++;
      continue;
    }
    let length: number;
    let min: number;
    if (lead >= 0xc2 && lead <= 0xdf) {
      length = 2;
      min = 0x80;
    } else if (lead >= 0xe0 && lead <= 0xef) {
      length = 3;
      min = 0x800;
    } else if (lead >= 0xf0 && lead <= 0xf4) {
      length = 4;
      min = 0x10000;
    } else {
      return false;
    }
    if (i + length > bytes.length) return false;
    let cp = lead & (0x7f >> length);
    for (let offset = 1; offset < length; offset++) {
      const next = bytes[i + offset]!;
      if ((next & 0xc0) !== 0x80) return false;
      cp = (cp << 6) | (next & 0x3f);
    }
    if (cp < min || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return false;
    i += length;
  }
  return true;
}

export function decodeUtf8(bytes: Uint8Array): string | null {
  if (!isValidUtf8(bytes)) return null;
  try {
    return utf8Decoder.decode(bytes);
  } catch {
    return null;
  }
}

export function encodeUtf8(text: string): Uint8Array {
  return utf8Encoder.encode(text);
}

export function bytesContain(bytes: Uint8Array, target: number): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === target) return true;
  }
  return false;
}
