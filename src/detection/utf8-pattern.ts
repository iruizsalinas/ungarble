import { utf8ContChars, utf8First2Chars, utf8First3Chars, utf8First4Chars } from "./byte-sets.js";

// Standalone chars excluded from the negative lookbehind in UTF8_DETECTOR_RE
export const commonStandaloneInCont = new Set([
  0x20,    // space
  0xa0,    // NBSP
  0xad,    // soft hyphen
  0xb7,    // middle dot
  0xb4,    // acute accent
  0x2013,  // en dash
  0x2014,  // em dash
  0x2018,  // left single quote
  0x2019,  // right single quote
  0x201c,  // left double quote
  0x201d,  // right double quote
  0x2026,  // horizontal ellipsis
  0x2022,  // bullet
  0x2020,  // dagger
  0x2021,  // double dagger
  0x2030,  // per mille
  0x2039,  // left single angle quote
  0x203a,  // right single angle quote
  0x20ac,  // euro
  0x2122,  // trademark
  0x201a,  // single low-9 quotation mark
  0x201e,  // double low-9 quotation mark
]);

export function charClassFromSet(chars: Set<number>): string {
  const sorted = [...chars].sort((a, b) => a - b);
  const escaped = sorted.map((cp) => {
    if (cp < 0x80) {
      const c = String.fromCharCode(cp);
      if ("-]\\^".includes(c)) return "\\" + c;
      return c;
    }
    const hex = cp.toString(16);
    if (cp <= 0xffff) return "\\u" + hex.padStart(4, "0");
    return "\\u{" + hex + "}";
  });
  return "[" + escaped.join("") + "]";
}

export const utf8ContStrict = new Set(utf8ContChars);

for (const cp of commonStandaloneInCont) {
  utf8ContStrict.delete(cp);
}

export const contClass = charClassFromSet(utf8ContChars);

export const contStrictClass = charClassFromSet(utf8ContStrict);

export const first2Class = charClassFromSet(utf8First2Chars);

export const first3Class = charClassFromSet(utf8First3Chars);

export const first4Class = charClassFromSet(utf8First4Chars);

// Matches sequences that look like UTF-8 bytes decoded as a single-byte encoding
const UTF8_DETECTOR_RE = new RegExp(
  `(?<!${contStrictClass})` +
  `(?:` +
    `${first2Class}${contClass}` +
    `|${first3Class}${contClass}{2}` +
    `|${first4Class}${contClass}{3}` +
  `)+`,
  "gu"
);

const UTF8_TEST_RE = new RegExp(UTF8_DETECTOR_RE.source, "u");

export function hasUtf8MojibakeSequence(text: string): boolean {
  return UTF8_TEST_RE.test(text);
}

export function findUtf8MojibakeSequences(text: string): RegExpStringIterator<RegExpExecArray> {
  return text.matchAll(UTF8_DETECTOR_RE);
}
