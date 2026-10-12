import { decodeSingleByte } from "../codecs/single-byte.js";

// Precomputed C1 control -> Windows-1252 lookup
export const C1_TO_WIN1252: string[] = [];

for (let b = 0x80; b <= 0x9f; b++) {
  C1_TO_WIN1252[b] = decodeSingleByte(new Uint8Array([b]), "sloppy-windows-1252");
}

export function fixC1Controls(text: string): string {
  let hasC1 = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0x80 && c <= 0x9f) { hasC1 = true; break; }
  }
  if (!hasC1) return text;

  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0x80 && c <= 0x9f) {
      if (i > start) parts.push(text.slice(start, i));
      parts.push(C1_TO_WIN1252[c]!);
      start = i + 1;
    }
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts.join("");
}
