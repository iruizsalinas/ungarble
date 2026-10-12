import { type EncodingName } from "./types.js";
import { CODEC_TABLES } from "./registry.js";

export function encodeSingleByte(text: string, encoding: EncodingName): Uint8Array | null {
  const table = CODEC_TABLES[encoding];
  if (!table) return null;

  const encodeMap = table.encode;
  const bytes = new Uint8Array(text.length);
  let i = 0;

  for (const char of text) {
    const cp = char.codePointAt(0)!;
    if (cp > 0xffff) return null; // Can't encode supplementary chars in single-byte
    const byte = encodeMap.get(cp);
    if (byte === undefined) return null;
    bytes[i++] = byte;
  }

  return bytes.subarray(0, i);
}

export function decodeSingleByte(bytes: Uint8Array, encoding: EncodingName): string {
  const table = CODEC_TABLES[encoding];
  if (!table) return "";

  const decodeTable = table.decode;
  const chars: string[] = [];

  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]!;
    if (byte < 0x80) {
      chars.push(String.fromCharCode(byte));
    } else {
      chars.push(String.fromCodePoint(decodeTable[byte - 0x80]!));
    }
  }

  return chars.join("");
}

export function getHighCharSet(encoding: EncodingName): Set<number> {
  const table = CODEC_TABLES[encoding];
  if (!table) return new Set();
  const set = new Set<number>();
  for (const cp of table.decode) {
    set.add(cp);
  }
  for (let i = 0; i < 0x80; i++) {
    set.add(i);
  }
  return set;
}
