import { isUtf8MojibakeLeadChar } from "../../detection/utf8-sequences.js";

export function hasC1ByteChar(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x80 && code <= 0x9f) return true;
  }
  return false;
}

export function isSingleAmbiguousScriptChar(text: string): boolean {
  if ([...text].length !== 1) return false;
  const cp = text.codePointAt(0);
  return cp !== undefined &&
    cp > 0x052f &&
    cp !== 0xfeff &&
    cp !== 0xfffd &&
    !(cp >= 0xff00 && cp <= 0xffef) &&
    !(cp >= 0xfb00 && cp <= 0xfb06) &&
    !(cp >= 0x1e00 && cp <= 0x1eff) &&
    !(cp >= 0x2000 && cp <= 0x28ff);
}

export function isSingleAmbiguousLatinChar(text: string): boolean {
  if ([...text].length !== 1) return false;
  const cp = text.codePointAt(0);
  return cp !== undefined && (
    (cp >= 0x00c0 && cp <= 0x024f) ||
    (cp >= 0x1e00 && cp <= 0x1eff)
  );
}

export function isNonAsciiMojibakeByteChar(char: string | undefined): boolean {
  const cp = char?.codePointAt(0);
  return cp === 0xfffd || (cp !== undefined && cp > 0x7f && isUtf8MojibakeLeadChar(char));
}
