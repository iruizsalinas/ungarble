import { type EncodingName } from "../codecs/types.js";
import { CODEC_TABLES } from "../codecs/registry.js";

export const CHARMAP_ENCODINGS: readonly EncodingName[] = [
  "latin-1",
  "sloppy-windows-1252",
  "sloppy-windows-1251",
  "sloppy-windows-1250",
  "sloppy-windows-1253",
  "sloppy-windows-1254",
  "sloppy-windows-1257",
  "iso-8859-2",
  "macroman",
  "cp437",
];

export function buildEncodingCharSet(encoding: EncodingName): Set<number> {
  const table = CODEC_TABLES[encoding];
  const set = new Set<number>();
  for (let i = 0; i < 0x80; i++) set.add(i);
  if (table) {
    for (const cp of table.decode) set.add(cp);
  }
  // Sloppy codecs deliberately encode U+FFFD as byte 0x1A so a damaged UTF-8
  // sequence can be reconstructed as a replacement character.
  if (encoding.startsWith("sloppy-")) set.add(0xfffd);
  return set;
}

export const encodingCharSets = new Map<EncodingName, Set<number>>();

for (const enc of CHARMAP_ENCODINGS) {
  encodingCharSets.set(enc, buildEncodingCharSet(enc));
}

encodingCharSets.set("windows-1252", buildEncodingCharSet("windows-1252"));

export function possibleEncoding(text: string, encoding: EncodingName): boolean {
  const charSet = encodingCharSets.get(encoding);
  if (!charSet) return false;
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    if (!charSet.has(cp)) return false;
  }
  return true;
}
