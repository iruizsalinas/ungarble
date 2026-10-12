import { CHARMAP_ENCODINGS } from "./encodings.js";
import { CODEC_TABLES } from "../codecs/registry.js";

export function buildUtf8ContinuationChars(): Set<number> {
  const chars = new Set<number>();
  for (const enc of CHARMAP_ENCODINGS) {
    const table = CODEC_TABLES[enc];
    if (!table) continue;
    for (let byteVal = 0x80; byteVal <= 0xbf; byteVal++) {
      chars.add(table.decode[byteVal - 0x80]!);
    }
  }
  // Also add space (stands in for 0xA0 when NBSP gets normalized)
  chars.add(0x20);
  return chars;
}

export function buildUtf8LeadChars(byteStart: number, byteEnd: number): Set<number> {
  const chars = new Set<number>();
  for (const enc of CHARMAP_ENCODINGS) {
    const table = CODEC_TABLES[enc];
    if (!table) continue;
    for (let byteVal = byteStart; byteVal <= byteEnd; byteVal++) {
      chars.add(table.decode[byteVal - 0x80]!);
    }
  }
  return chars;
}

export const utf8ContChars = buildUtf8ContinuationChars();

export const utf8First2Chars = buildUtf8LeadChars(0xc2, 0xdf);

export const utf8First3Chars = buildUtf8LeadChars(0xe0, 0xef);

// Only F0-F4 produce valid Unicode codepoints
export const utf8First4Chars = buildUtf8LeadChars(0xf0, 0xf4);
