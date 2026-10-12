import { codePointStringAt, hasC1ByteChar, isSingleAmbiguousScriptChar } from "./characters.js";

export function isAmbiguousSingleNonLatinMojibakeSource(text: string): boolean {
  if (text.length < 2 || text.length > 4 || hasC1ByteChar(text)) return false;
  return (
    text[0] === "\u00b5" ||
    text[0] === "\u00d7" ||
    text[0] === "\u00e0" ||
    text[0] === "\u00f7" ||
    text[0] === "\u2026" ||
    text[0] === "\u20ac"
  );
}

export function isAmbiguousSingleNonLatinMojibake(text: string, decoded: string): boolean {
  if (text.length < 2 || text.length > 3 || hasC1ByteChar(text)) {
    return false;
  }

  return isSingleAmbiguousScriptChar(decoded);
}

export function startsWithAmbiguousSingleNonLatinMojibake(text: string, decoded: string): boolean {
  if (text.length <= 3) return false;

  for (const sourceLength of [2, 3]) {
    if (text.length < sourceLength || decoded.length < 1) continue;

    const source = text.slice(0, sourceLength);
    if (hasC1ByteChar(source)) continue;

    const decodedFirst = codePointStringAt(decoded, 0);
    if (
      isSingleAmbiguousScriptChar(decodedFirst) &&
      decoded.slice(decodedFirst.length) === text.slice(sourceLength)
    ) {
      return true;
    }
  }

  return false;
}

export function containsAmbiguousSingleNonLatinMojibakeReplacement(text: string, decoded: string): boolean {
  if (text.length <= 3) return false;

  let index = 0;
  while (index < text.length && index < decoded.length && text[index] === decoded[index]) {
    index++;
  }

  for (const sourceLength of [2, 3]) {
    if (index + sourceLength > text.length || index >= decoded.length) continue;

    const source = text.slice(index, index + sourceLength);
    if (hasC1ByteChar(source)) continue;

    const decodedFirst = codePointStringAt(decoded, index);
    if (
      isSingleAmbiguousScriptChar(decodedFirst) &&
      decoded.slice(index + decodedFirst.length) === text.slice(index + sourceLength)
    ) {
      return true;
    }
  }

  return false;
}
