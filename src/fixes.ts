import {
  LOSSY_UTF8_RE,
  LIGATURES, CONTROL_CHAR_RE, WIDTH_MAP,
  HTML_ENTITIES, HTML_ENTITY_RE,
  UTF8_DETECTOR_RE,
  isUtf8MojibakeByteChar,
} from "./chardata.js";
import { decodeSingleByte } from "./codecs.js";
import { isBad } from "./badness.js";

export function unescapeHtml(text: string): string {
  return text.replace(HTML_ENTITY_RE, (match) => {
    if (match.startsWith("&#")) {
      const numStr = match.slice(2, -1);
      let cp: number;
      if (numStr.startsWith("x") || numStr.startsWith("X")) {
        const hexPart = numStr.slice(1);
        if (!/^[0-9A-Fa-f]+$/.test(hexPart)) return match;
        cp = parseInt(hexPart, 16);
      } else {
        if (!/^[0-9]+$/.test(numStr)) return match;
        cp = parseInt(numStr, 10);
      }
      if (isNaN(cp)) return match;
      if (cp > 0x10ffff) return "\ufffd";
      // Handle Windows-1252 "HTML5 numeric entity" range (0x80-0x9F)
      // These get mapped to the Windows-1252 character, not the C1 control
      if (cp >= 0x80 && cp <= 0x9f) {
        const bytes = new Uint8Array([cp]);
        return decodeSingleByte(bytes, "windows-1252");
      }
      if (cp === 0) return "";
      try {
        return String.fromCodePoint(cp);
      } catch {
        return "\ufffd";
      }
    }

    const resolved = HTML_ENTITIES.get(match);
    if (resolved !== undefined) return resolved;

    return match;
  });
}

const CSI_TERMINAL_ESCAPE_RE = /\x01?\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]\x02?/g;
const OSC_TERMINAL_ESCAPE_RE = /\x01?\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)\x02?/g;

export function removeTerminalEscapes(text: string): string {
  return text
    .replace(OSC_TERMINAL_ESCAPE_RE, "")
    .replace(CSI_TERMINAL_ESCAPE_RE, "");
}

const SINGLE_QUOTE_RE = /[\u2018\u2019\u201a\u201b]/g;
const DOUBLE_QUOTE_RE = /[\u201c\u201d\u201e\u201f]/g;
const TOKEN_BOUNDARY_RE = /[\s"'`()[\]{}<>&|\\/:;!?]/u;

export function uncurlQuotes(text: string): string {
  return text
    .replace(SINGLE_QUOTE_RE, "'")
    .replace(DOUBLE_QUOTE_RE, '"');
}

export function fixLatinLigatures(text: string): string {
  const result: string[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    const replacement = LIGATURES.get(cp);
    if (replacement !== undefined) {
      result.push(replacement);
    } else {
      result.push(char);
    }
  }
  return result.join("");
}

export function fixCharacterWidth(text: string): string {
  const result: string[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    const replacement = WIDTH_MAP.get(cp);
    if (replacement !== undefined) {
      result.push(replacement);
    } else {
      result.push(char);
    }
  }
  return result.join("");
}

export function fixLineBreaks(text: string): string {
  // NEL (U+0085) is NOT converted here -- it's a C1 control character handled
  // by fixC1Controls (mapped to U+2026 HORIZONTAL ELLIPSIS via Windows-1252).
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n");
}

export function fixSurrogates(text: string): string {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        result.push(text[i]! + text[i + 1]!);
        i++;
      } else {
        result.push("\ufffd");
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      result.push("\ufffd");
    } else {
      result.push(text[i]!);
    }
  }
  return result.join("");
}

export function removeControlChars(text: string): string {
  return text.replace(CONTROL_CHAR_RE, "");
}

export function restoreByteA0(bytes: Uint8Array): Uint8Array {
  const result = new Uint8Array(Math.ceil(bytes.length * 1.5));
  let ri = 0;

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;

    // C3 + space: a-grave word pattern (French/Portuguese)
    if (b === 0xc3 && i + 1 < bytes.length && bytes[i + 1] === 0x20) {
      const remaining = bytes.subarray(i + 2);
      const graveResult = classifyAGraveContext(remaining);
      if (graveResult === "separate") {
        result[ri++] = 0xc3;
        result[ri++] = 0xa0;
        result[ri++] = 0x20;
        i++;
        continue;
      } else if (graveResult === "attached") {
        result[ri++] = 0xc3;
        result[ri++] = 0xa0;
        i++;
        continue;
      }
    }

    // 2-byte: lead + space -> lead + A0 (skip if preceded by space to avoid spaced-out false positives)
    if (
      (b === 0xc2 || b === 0xc3 || b === 0xc5 || b === 0xce || b === 0xd0 || b === 0xd9) &&
      i + 1 < bytes.length &&
      bytes[i + 1] === 0x20 &&
      (i === 0 || bytes[i - 1] !== 0x20)
    ) {
      result[ri++] = b;
      result[ri++] = 0xa0;
      i++; // skip the space
      continue;
    }

    // 3-byte: lead + space + continuation -> lead + A0 + continuation
    if (
      b >= 0xe0 && b <= 0xef &&
      i + 2 < bytes.length &&
      bytes[i + 1] === 0x20 &&
      (bytes[i + 2]! & 0xc0) === 0x80
    ) {
      result[ri++] = b;
      result[ri++] = 0xa0;
      i++; // skip the space
      continue;
    }

    // 3-byte: E0 + continuation + space -> E0 + continuation + A0
    // restricted to E0 (Thai/Devanagari); E1-EF would produce CJK false positives
    if (
      b === 0xe0 &&
      i + 2 < bytes.length &&
      (bytes[i + 1]! & 0xc0) === 0x80 &&
      bytes[i + 2] === 0x20
    ) {
      result[ri++] = b;
      result[ri++] = bytes[i + 1]!;
      result[ri++] = 0xa0;
      i += 2; // skip continuation + space
      continue;
    }

    // 4-byte: F0 + space + continuation + continuation
    if (
      b === 0xf0 &&
      i + 3 < bytes.length &&
      bytes[i + 1] === 0x20 &&
      (bytes[i + 2]! & 0xc0) === 0x80 &&
      (bytes[i + 3]! & 0xc0) === 0x80
    ) {
      result[ri++] = b;
      result[ri++] = 0xa0;
      i++; // skip the space
      continue;
    }

    result[ri++] = b;
  }

  return result.subarray(0, ri);
}

function classifyAGraveContext(remaining: Uint8Array): "separate" | "attached" | "none" {
  const preview = bytesToIdentityString(remaining.subarray(0, Math.min(20, remaining.length)));

  // Portuguese contractions (no space needed)
  if (/^(?:s[\s,;.!?)]|s$|quele|quela|quilo)/i.test(preview)) return "attached";

  // French (space separator needed)
  if (/^(?:la |les |l'|d'|une? |cette |celui |celle |n'|qu'|jusqu'|lorsqu'|puisqu'|quoiqu'|quelqu'|aujourd'|entr'|presqu')/i.test(preview)) return "separate";

  if (preview.length > 0 && !/^\s/.test(preview) && !/^[A-Z] /.test(preview)) return "separate";

  return "none";
}

// Identity byte<->string conversion: byte N <-> U+00N (true Latin-1 / ISO-8859-1)
// Node's TextDecoder("iso-8859-1") remaps 0x80-0x9F to Windows-1252 (WHATWG spec),
// so we must do this manually for lossless round-tripping.
function bytesToIdentityString(bytes: Uint8Array): string {
  const chars: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    chars.push(String.fromCharCode(bytes[i]!));
  }
  return chars.join("");
}

function identityStringToBytes(str: string): Uint8Array {
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

function isTokenBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  const code = text.charCodeAt(index);
  return (
    code <= 0x20 ||
    code === 0x7f ||
    code === 0x2026 ||
    (code >= 0x2018 && code <= 0x201f) ||
    code === 0x2039 ||
    code === 0x203a ||
    (code >= 0x80 && code <= 0x9f) ||
    (code > 0x052f && !isUtf8MojibakeByteChar(text[index])) ||
    TOKEN_BOUNDARY_RE.test(text[index]!)
  );
}

function tokenAround(text: string, start: number, end: number): { start: number; end: number; text: string } {
  let tokenStart = start;
  let tokenEnd = end;

  while (tokenStart > 0 && !isTokenBoundary(text, tokenStart - 1)) {
    tokenStart--;
  }

  while (tokenEnd < text.length && !isTokenBoundary(text, tokenEnd)) {
    tokenEnd++;
  }

  return { start: tokenStart, end: tokenEnd, text: text.slice(tokenStart, tokenEnd) };
}

function isMojibakeMatchBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) return true;
  return isTokenBoundary(text, index) || /[.,]/u.test(text[index]!);
}

function hasWordAfterAdjacentPunctuation(text: string, index: number): boolean {
  let sawPunctuation = false;
  for (let i = index; i < text.length; i++) {
    const char = text[i]!;
    if (/[\s"'`()[\]{}<>&|\\/:;!?]/u.test(char)) return false;
    if (/[.,\u2026]/u.test(char)) {
      sawPunctuation = true;
      continue;
    }
    return sawPunctuation && /[\p{L}\p{N}]/u.test(char);
  }
  return false;
}

function hasC1ByteChar(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x80 && code <= 0x9f) return true;
  }
  return false;
}

function isSingleAmbiguousScriptChar(text: string): boolean {
  if ([...text].length !== 1) return false;
  const cp = text.codePointAt(0);
  return cp !== undefined &&
    cp > 0x052f &&
    !(cp >= 0x1e00 && cp <= 0x1eff) &&
    !(cp >= 0x2000 && cp <= 0x27bf);
}

function highCodepointRepairGroup(cp: number): string | null {
  if (cp <= 0x052f) return null;
  if (cp >= 0x1e00 && cp <= 0x1eff) return null;
  if (cp >= 0x2000 && cp <= 0x27bf) return null;
  if (cp >= 0x0590 && cp <= 0x05ff) return "hebrew";
  if (cp >= 0x0600 && cp <= 0x06ff) return "arabic";
  if (cp >= 0x0900 && cp <= 0x097f) return "devanagari";
  if (cp >= 0x0e00 && cp <= 0x0e7f) return "thai";
  if (cp >= 0x3040 && cp <= 0x30ff) return "kana";
  if (cp >= 0x4e00 && cp <= 0x9fff) return "cjk";
  if (cp >= 0xac00 && cp <= 0xd7af) return "hangul";
  if (cp >= 0x1f000 && cp <= 0x1faff) return "emoji";
  return "other";
}

function hasUnsupportedHighCodepointRepair(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && highCodepointRepairGroup(cp) === "other") {
      return true;
    }
  }
  return false;
}

function hasCyrillicText(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp !== undefined && cp >= 0x0400 && cp <= 0x052f) return true;
  }
  return false;
}

function hasCyrillicMojibakeSourceSignal(text: string): boolean {
  return /[\u00d0-\u00d3\u0412\u0413\u0420\u0421\u0432\u0402\u2568\u2564]/u.test(text);
}

function hasHebrewMixedWithOtherHighScript(text: string): boolean {
  let hasHebrew = false;
  let hasOther = false;

  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (group === "hebrew") hasHebrew = true;
    else if (group !== null && group !== "emoji") hasOther = true;
  }

  return hasHebrew && hasOther;
}

function hasLatinText(text: string): boolean {
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    if (
      (cp >= 0x41 && cp <= 0x5a) ||
      (cp >= 0x61 && cp <= 0x7a) ||
      (cp >= 0x00c0 && cp <= 0x024f) ||
      (cp >= 0x1e00 && cp <= 0x1eff)
    ) {
      return true;
    }
  }
  return false;
}

function hasMixedHighScriptWithLatinText(text: string): boolean {
  const groups = new Set<string>();
  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (group !== null && group !== "emoji") groups.add(group);
  }
  return groups.size > 1 && hasLatinText(text);
}

function hasDevanagariCjkRepairFromSeparatedSource(text: string, decoded: string): boolean {
  let hasDevanagari = false;
  let hasCjk = false;

  for (const char of decoded) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const group = highCodepointRepairGroup(cp);
    if (group === "devanagari") hasDevanagari = true;
    if (group === "cjk") hasCjk = true;
  }

  return hasDevanagari && hasCjk && /\s/u.test(text);
}

function hasSingleHighScriptCharWithWordText(text: string): boolean {
  let highCount = 0;
  let hasWordText = false;

  for (const char of text) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;

    const group = highCodepointRepairGroup(cp);
    if (group !== null && group !== "emoji") {
      highCount++;
    } else if (/[\p{L}\p{N}]/u.test(char)) {
      hasWordText = true;
    }
  }

  return highCount === 1 && hasWordText;
}

function isAmbiguousSingleNonLatinMojibakeSource(text: string): boolean {
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

    const decodedFirst = [...decoded][0] ?? "";
    if (
      isSingleAmbiguousScriptChar(decodedFirst) &&
      decoded.slice(decodedFirst.length) === text.slice(sourceLength)
    ) {
      return true;
    }
  }

  return false;
}

export function hasUnsupportedNonLatinMojibakeRepair(text: string, decoded: string): boolean {
  return !hasC1ByteChar(text) && (
    hasUnsupportedHighCodepointRepair(decoded) ||
    (hasCyrillicText(decoded) && !hasCyrillicMojibakeSourceSignal(text)) ||
    hasHebrewMixedWithOtherHighScript(decoded) ||
    hasMixedHighScriptWithLatinText(decoded) ||
    hasDevanagariCjkRepairFromSeparatedSource(text, decoded) ||
    hasSingleHighScriptCharWithWordText(decoded)
  );
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

    const decodedFirst = [...decoded.slice(index)][0] ?? "";
    if (
      isSingleAmbiguousScriptChar(decodedFirst) &&
      decoded.slice(index + decodedFirst.length) === text.slice(index + sourceLength)
    ) {
      return true;
    }
  }

  return false;
}

export function decodeInconsistentUtf8(text: string, fixEncodingFn: (t: string) => string): string {
  UTF8_DETECTOR_RE.lastIndex = 0;
  let result = "";
  let lastIndex = 0;
  const fixedSegments = new Map<string, string>();

  for (const match of text.matchAll(UTF8_DETECTOR_RE)) {
    const matchStr = match[0];
    const matchIndex = match.index;

    // guard: shorter than full text (prevents recursion) and actually bad
    if (matchStr.length >= text.length) continue;
    if (isAmbiguousSingleNonLatinMojibakeSource(matchStr)) continue;

    let segmentStart = matchIndex;
    let segmentEnd = matchIndex + matchStr.length;
    let segmentStr = matchStr;
    if (!isBad(matchStr)) {
      const token = tokenAround(text, matchIndex, segmentEnd);
      if (token.text.length <= matchStr.length || !isBad(token.text)) continue;
      segmentStart = token.start;
      segmentEnd = token.end;
      segmentStr = token.text;
    }
    if (segmentStr.length >= text.length) continue;
    if (segmentStart < lastIndex) continue;

    // skip spaced-out text like "C O N C L U S [C3] O"
    if (segmentStr.endsWith(" ") && segmentStart >= 2) {
      const prevTwo = text.slice(segmentStart - 2, segmentStart);
      if (/^\S $/u.test(prevTwo)) continue;
    }

    let fixed = fixedSegments.get(segmentStr);
    if (fixed === undefined) {
      fixed = fixEncodingFn(segmentStr);
      fixedSegments.set(segmentStr, fixed);
    }
    if (
      segmentStr === matchStr &&
      isAmbiguousSingleNonLatinMojibake(segmentStr, fixed)
    ) {
      const token = tokenAround(text, matchIndex, matchIndex + matchStr.length);
      if (
        token.text.length > matchStr.length &&
        (
          !isMojibakeMatchBoundary(text, matchIndex - 1) ||
          !isMojibakeMatchBoundary(text, matchIndex + matchStr.length) ||
          /[\p{L}\p{N}]/u.test(text.slice(matchIndex + matchStr.length, token.end))
        )
      ) {
        continue;
      }
    }
    if (
      startsWithAmbiguousSingleNonLatinMojibake(segmentStr, fixed) ||
      containsAmbiguousSingleNonLatinMojibakeReplacement(segmentStr, fixed) ||
      hasUnsupportedNonLatinMojibakeRepair(segmentStr, fixed)
    ) {
      continue;
    }
    if (fixed !== segmentStr) {
      result += text.slice(lastIndex, segmentStart);
      // preserve word-boundary space consumed by fix, except Portuguese contractions
      if (segmentStr.endsWith(" ") && !fixed.endsWith(" ") && fixed.length < segmentStr.length) {
        const rest = text.slice(segmentEnd);
        const isPortugueseContraction = fixed === "\u00e0" && /^(?:s[\s,;.!?)]|s$|quele|quela|quilo)/i.test(rest);
        if (isPortugueseContraction) {
          result += fixed;
        } else if (rest.length > 0 && !rest.startsWith(" ")) {
          result += fixed + " ";
        } else {
          result += fixed;
        }
      } else {
        result += fixed;
      }
      lastIndex = segmentEnd;
    }
  }

  if (lastIndex === 0) return text;
  result += text.slice(lastIndex);
  return result;
}

export function fixBadTokens(text: string, fixEncodingFn: (t: string) => string): string {
  let result = "";
  let lastIndex = 0;
  let changed = false;
  const fixedTokens = new Map<string, string>();

  for (let i = 0; i < text.length;) {
    if (isTokenBoundary(text, i)) {
      i++;
      continue;
    }

    const start = i;
    while (i < text.length && !isTokenBoundary(text, i)) {
      i++;
    }

    const token = text.slice(start, i);
    if (token.length >= text.length || !isBad(token)) continue;

    let fixed = fixedTokens.get(token);
    if (fixed === undefined) {
      fixed = fixEncodingFn(token);
      fixedTokens.set(token, fixed);
    }
    if (isAmbiguousSingleNonLatinMojibakeSource(token)) {
      continue;
    }
    if (
      isAmbiguousSingleNonLatinMojibake(token, fixed) &&
      hasWordAfterAdjacentPunctuation(text, i)
    ) {
      continue;
    }
    if (
      startsWithAmbiguousSingleNonLatinMojibake(token, fixed) ||
      containsAmbiguousSingleNonLatinMojibakeReplacement(token, fixed) ||
      hasUnsupportedNonLatinMojibakeRepair(token, fixed)
    ) {
      continue;
    }
    if (fixed !== token) {
      result += text.slice(lastIndex, start) + fixed;
      lastIndex = i;
      changed = true;
    }
  }

  if (!changed) return text;
  return result + text.slice(lastIndex);
}

// Precomputed C1 control -> Windows-1252 lookup
const C1_TO_WIN1252: string[] = [];
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
