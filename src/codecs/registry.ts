import { WINDOWS_1253, WINDOWS_1257, WINDOWS_1251, WINDOWS_1250 } from "./tables/european.js";
import { type EncodingName, type CodecTable } from "./types.js";
import { WINDOWS_1252, WINDOWS_1254, ISO_8859_2, MACROMAN, CP437 } from "./tables/western.js";

export function buildEncodeMap(decodeTable: readonly number[]): Map<number, number> {
  const map = new Map<number, number>();
  for (let i = 0; i < 0x80; i++) {
    map.set(i, i);
  }
  for (let i = 0; i < decodeTable.length; i++) {
    const cp = decodeTable[i]!;
    const byte = i + 0x80;
    // first mapping wins -- real charset entry takes priority over sloppy fallback
    if (!map.has(cp)) {
      map.set(cp, byte);
    }
  }
  return map;
}

export function buildSloppyTable(table: readonly number[]): readonly number[] {
  const result = [...table];
  for (let i = 0; i < result.length; i++) {
    if (result[i] === 0xfffd) {
      result[i] = i + 0x80;
    }
  }
  return result;
}

// Latin-1 is identity: byte N -> U+00N
export const LATIN_1_DECODE: readonly number[] = Array.from({ length: 128 }, (_, i) => i + 0x80);

export const SLOPPY_1253 = buildSloppyTable(WINDOWS_1253);

export const SLOPPY_1257 = buildSloppyTable(WINDOWS_1257);

export const CODEC_TABLES: Record<EncodingName, CodecTable> = {
  "latin-1": { decode: LATIN_1_DECODE, encode: buildEncodeMap(LATIN_1_DECODE) },
  "windows-1252": { decode: WINDOWS_1252, encode: buildEncodeMap(WINDOWS_1252) },
  "sloppy-windows-1252": { decode: WINDOWS_1252, encode: buildEncodeMap(WINDOWS_1252) },
  "sloppy-windows-1251": { decode: WINDOWS_1251, encode: buildEncodeMap(WINDOWS_1251) },
  "sloppy-windows-1250": { decode: WINDOWS_1250, encode: buildEncodeMap(WINDOWS_1250) },
  "sloppy-windows-1253": { decode: SLOPPY_1253, encode: buildEncodeMap(SLOPPY_1253) },
  "sloppy-windows-1254": { decode: WINDOWS_1254, encode: buildEncodeMap(WINDOWS_1254) },
  "sloppy-windows-1257": { decode: SLOPPY_1257, encode: buildEncodeMap(SLOPPY_1257) },
  "iso-8859-2": { decode: ISO_8859_2, encode: buildEncodeMap(ISO_8859_2) },
  "macroman": { decode: MACROMAN, encode: buildEncodeMap(MACROMAN) },
  "cp437": { decode: CP437, encode: buildEncodeMap(CP437) },
};

// For sloppy codecs, add the special U+FFFD -> 0x1A mapping (for lossy recovery)
for (const name of [
  "sloppy-windows-1252", "sloppy-windows-1251", "sloppy-windows-1250",
  "sloppy-windows-1253", "sloppy-windows-1254", "sloppy-windows-1257",
] as const) {
  CODEC_TABLES[name].encode.set(0xfffd, 0x1a);
}
