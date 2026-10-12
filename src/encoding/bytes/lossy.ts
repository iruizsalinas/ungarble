import { LOSSY_UTF8_RE } from "../../detection/control-patterns.js";

// Identity byte<->string conversion: byte N <-> U+00N (true Latin-1 / ISO-8859-1)
// Node's TextDecoder("iso-8859-1") remaps 0x80-0x9F to Windows-1252 (WHATWG spec),
// so we must do this manually for lossless round-tripping.
export function bytesToIdentityString(bytes: Uint8Array): string {
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(String.fromCharCode(bytes[i]!));
  }
  return chars.join("");
}

export function identityStringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i) & 0xff;
  }
  return bytes;
}

export function replaceLossySequences(bytes: Uint8Array): Uint8Array {
  const str = bytesToIdentityString(bytes);
  const fixed = str.replace(LOSSY_UTF8_RE, "\xef\xbf\xbd"); // UTF-8 for U+FFFD
  return identityStringToBytes(fixed);
}
