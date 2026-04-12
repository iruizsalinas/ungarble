import {
  LOSSY_UTF8_RE,
  LIGATURES, CONTROL_CHAR_RE, WIDTH_MAP,
  HTML_ENTITIES, HTML_ENTITY_RE,
  UTF8_DETECTOR_RE,
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

const FULL_TERMINAL_ESCAPE_RE = /\x01?\x1b\[[\d;]*[a-zA-Z]\x02?/g;

export function removeTerminalEscapes(text: string): string {
  return text.replace(FULL_TERMINAL_ESCAPE_RE, "");
}

const SINGLE_QUOTE_RE = /[\u2018\u2019\u201a\u201b]/g;
const DOUBLE_QUOTE_RE = /[\u201c\u201d\u201e\u201f]/g;

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

export function decodeInconsistentUtf8(text: string, fixEncodingFn: (t: string) => string): string {
  UTF8_DETECTOR_RE.lastIndex = 0;
  let result = "";
  let lastIndex = 0;

  for (const match of text.matchAll(UTF8_DETECTOR_RE)) {
    const matchStr = match[0];
    const matchIndex = match.index;

    // guard: shorter than full text (prevents recursion) and actually bad
    if (matchStr.length >= text.length) continue;
    if (!isBad(matchStr)) continue;

    // skip spaced-out text like "C O N C L U S [C3] O"
    if (matchStr.endsWith(" ") && matchIndex >= 2) {
      const prevTwo = text.slice(matchIndex - 2, matchIndex);
      if (/^\S $/u.test(prevTwo)) continue;
    }

    const fixed = fixEncodingFn(matchStr);
    if (fixed !== matchStr) {
      result += text.slice(lastIndex, matchIndex);
      // preserve word-boundary space consumed by fix, except Portuguese contractions
      if (matchStr.endsWith(" ") && !fixed.endsWith(" ") && fixed.length < matchStr.length) {
        const rest = text.slice(matchIndex + matchStr.length);
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
      lastIndex = matchIndex + matchStr.length;
    }
  }

  if (lastIndex === 0) return text;
  result += text.slice(lastIndex);
  return result;
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
