export const utf8Encoder = new TextEncoder();

export function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    // `ignoreBOM: true` means "do not use a BOM as a decoding signature" and
    // therefore preserves U+FEFF for the caller to handle explicitly.
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    return decoder.decode(bytes);
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
