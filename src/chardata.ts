import { type EncodingName, CODEC_TABLES } from "./codecs.js";

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

function buildEncodingCharSet(encoding: EncodingName): Set<number> {
  const table = CODEC_TABLES[encoding];
  const set = new Set<number>();
  for (let i = 0; i < 0x80; i++) set.add(i);
  if (table) {
    for (const cp of table.decode) set.add(cp);
  }
  return set;
}

const encodingCharSets = new Map<EncodingName, Set<number>>();
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

function buildUtf8ContinuationChars(): Set<number> {
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

function buildUtf8LeadChars(byteStart: number, byteEnd: number): Set<number> {
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

const utf8ContChars = buildUtf8ContinuationChars();
const utf8First2Chars = buildUtf8LeadChars(0xc2, 0xdf);
const utf8First3Chars = buildUtf8LeadChars(0xe0, 0xef);
// Only F0-F4 produce valid Unicode codepoints
const utf8First4Chars = buildUtf8LeadChars(0xf0, 0xf4);

// Standalone chars excluded from the negative lookbehind in UTF8_DETECTOR_RE
const commonStandaloneInCont = new Set([
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

function charClassFromSet(chars: Set<number>): string {
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

const utf8ContStrict = new Set(utf8ContChars);
for (const cp of commonStandaloneInCont) {
  utf8ContStrict.delete(cp);
}

const contClass = charClassFromSet(utf8ContChars);
const contStrictClass = charClassFromSet(utf8ContStrict);
const first2Class = charClassFromSet(utf8First2Chars);
const first3Class = charClassFromSet(utf8First3Chars);
const first4Class = charClassFromSet(utf8First4Chars);

export function utf8MojibakeSequenceLengthAt(text: string, index: number): number {
  const first = text.codePointAt(index);
  if (first === undefined) return 0;

  for (const [length, leadChars] of [
    [4, utf8First4Chars],
    [3, utf8First3Chars],
    [2, utf8First2Chars],
  ] as const) {
    if (!leadChars.has(first) || index + length > text.length) continue;

    let valid = true;
    for (let offset = 1; offset < length; offset++) {
      const cp = text.codePointAt(index + offset);
      if (cp === undefined || !utf8ContChars.has(cp)) {
        valid = false;
        break;
      }
    }

    if (valid) return length;
  }

  return 0;
}

export function isUtf8MojibakeByteChar(char: string | undefined): boolean {
  if (char === undefined) return false;
  const cp = char.codePointAt(0);
  if (cp === undefined) return false;
  return utf8ContChars.has(cp) || utf8First2Chars.has(cp) || utf8First3Chars.has(cp) || utf8First4Chars.has(cp);
}

// Matches sequences that look like UTF-8 bytes decoded as a single-byte encoding
export const UTF8_DETECTOR_RE = new RegExp(
  `(?<!${contStrictClass})` +
  `(?:` +
    `${first2Class}${contClass}` +
    `|${first3Class}${contClass}{2}` +
    `|${first4Class}${contClass}{3}` +
  `)+`,
  "gu"
);

export const C1_CONTROL_RE = /[\x80-\x9f]/g;

export const ALTERED_UTF8_RE = /[\xc2\xc3\xc5\xce\xd0\xd9] /g;

// A-grave word pattern: C3 + space at word boundary, used for French/Portuguese.
export const A_GRAVE_WORD_RE = /\xc3 (?=(?:la |les |s'|qu|l'|d'|une? |cette |celui |celle |n'|qu'|jusqu'|lorsqu'|puisqu'|quoiqu'|quelqu'|aujourd'|entr'|presqu'|àquele|àquela|àquilo|às )|\S)/gi;

export const LOSSY_UTF8_RE = /[\xc2-\xdf][\x1a?]|[\xe0-\xef][\x1a?\x80-\xbf][\x1a?]|[\xf0-\xf4][\x1a?\x80-\xbf][\x1a?\x80-\xbf][\x1a?]/g;

export const LIGATURES = new Map<number, string>([
  [0xfb00, "ff"],
  [0xfb01, "fi"],
  [0xfb02, "fl"],
  [0xfb03, "ffi"],
  [0xfb04, "ffl"],
  [0xfb05, "st"],  // long st
  [0xfb06, "st"],
  [0x0132, "IJ"],
  [0x0133, "ij"],
  [0x01c7, "LJ"],
  [0x01c8, "Lj"],
  [0x01c9, "lj"],
  [0x01ca, "NJ"],
  [0x01cb, "Nj"],
  [0x01cc, "nj"],
  [0x01f1, "DZ"],
  [0x01f2, "Dz"],
  [0x01f3, "dz"],
  // Croatian digraph
  [0x01c4, "D\u017d"],
  [0x01c5, "D\u017e"],
  [0x01c6, "d\u017e"],
  // Afrikaans
  [0x0149, "\u02bcn"],
]);

export const CONTROL_CHAR_RE = /[\x00-\x08\x0b\x0e-\x1f\x7f\u206a-\u206f\ufeff\ufff9-\ufffc]/g;

function buildWidthMap(): Map<number, string> {
  const map = new Map<number, string>();
  for (let cp = 0xff01; cp <= 0xff5e; cp++) {
    map.set(cp, String.fromCharCode(cp - 0xff01 + 0x21));
  }
  map.set(0x3000, " ");
  return map;
}

export const WIDTH_MAP = buildWidthMap();

const HTML_ENTITY_ENTRIES: Array<[string, string]> = [
  // Common named entities
  ["amp", "&"], ["lt", "<"], ["gt", ">"], ["quot", "\""],
  ["apos", "'"], ["nbsp", "\u00a0"],
  // Latin accented
  ["Agrave", "\u00c0"], ["Aacute", "\u00c1"], ["Acirc", "\u00c2"],
  ["Atilde", "\u00c3"], ["Auml", "\u00c4"], ["Aring", "\u00c5"],
  ["AElig", "\u00c6"], ["Ccedil", "\u00c7"], ["Egrave", "\u00c8"],
  ["Eacute", "\u00c9"], ["Ecirc", "\u00ca"], ["Euml", "\u00cb"],
  ["Igrave", "\u00cc"], ["Iacute", "\u00cd"], ["Icirc", "\u00ce"],
  ["Iuml", "\u00cf"], ["ETH", "\u00d0"], ["Ntilde", "\u00d1"],
  ["Ograve", "\u00d2"], ["Oacute", "\u00d3"], ["Ocirc", "\u00d4"],
  ["Otilde", "\u00d5"], ["Ouml", "\u00d6"], ["Oslash", "\u00d8"],
  ["Ugrave", "\u00d9"], ["Uacute", "\u00da"], ["Ucirc", "\u00db"],
  ["Uuml", "\u00dc"], ["Yacute", "\u00dd"], ["THORN", "\u00de"],
  ["szlig", "\u00df"],
  ["agrave", "\u00e0"], ["aacute", "\u00e1"], ["acirc", "\u00e2"],
  ["atilde", "\u00e3"], ["auml", "\u00e4"], ["aring", "\u00e5"],
  ["aelig", "\u00e6"], ["ccedil", "\u00e7"], ["egrave", "\u00e8"],
  ["eacute", "\u00e9"], ["ecirc", "\u00ea"], ["euml", "\u00eb"],
  ["igrave", "\u00ec"], ["iacute", "\u00ed"], ["icirc", "\u00ee"],
  ["iuml", "\u00ef"], ["eth", "\u00f0"], ["ntilde", "\u00f1"],
  ["ograve", "\u00f2"], ["oacute", "\u00f3"], ["ocirc", "\u00f4"],
  ["otilde", "\u00f5"], ["ouml", "\u00f6"], ["oslash", "\u00f8"],
  ["ugrave", "\u00f9"], ["uacute", "\u00fa"], ["ucirc", "\u00fb"],
  ["uuml", "\u00fc"], ["yacute", "\u00fd"], ["thorn", "\u00fe"],
  ["yuml", "\u00ff"],
  // Symbols
  ["copy", "\u00a9"], ["reg", "\u00ae"], ["trade", "\u2122"],
  ["euro", "\u20ac"], ["pound", "\u00a3"], ["yen", "\u00a5"],
  ["cent", "\u00a2"], ["curren", "\u00a4"],
  ["deg", "\u00b0"], ["micro", "\u00b5"], ["para", "\u00b6"],
  ["sect", "\u00a7"], ["middot", "\u00b7"], ["bull", "\u2022"],
  ["hellip", "\u2026"], ["prime", "\u2032"], ["Prime", "\u2033"],
  // Punctuation
  ["ndash", "\u2013"], ["mdash", "\u2014"],
  ["lsquo", "\u2018"], ["rsquo", "\u2019"],
  ["sbquo", "\u201a"], ["ldquo", "\u201c"],
  ["rdquo", "\u201d"], ["bdquo", "\u201e"],
  ["laquo", "\u00ab"], ["raquo", "\u00bb"],
  ["lsaquo", "\u2039"], ["rsaquo", "\u203a"],
  // Math
  ["times", "\u00d7"], ["divide", "\u00f7"],
  ["plusmn", "\u00b1"], ["minus", "\u2212"],
  ["le", "\u2264"], ["ge", "\u2265"], ["ne", "\u2260"],
  ["frac14", "\u00bc"], ["frac12", "\u00bd"], ["frac34", "\u00be"],
  ["sup1", "\u00b9"], ["sup2", "\u00b2"], ["sup3", "\u00b3"],
  // Arrows
  ["larr", "\u2190"], ["rarr", "\u2192"], ["uarr", "\u2191"], ["darr", "\u2193"],
  // Greek letters (common ones)
  ["Alpha", "\u0391"], ["Beta", "\u0392"], ["Gamma", "\u0393"],
  ["Delta", "\u0394"], ["Epsilon", "\u0395"], ["Zeta", "\u0396"],
  ["Eta", "\u0397"], ["Theta", "\u0398"], ["Iota", "\u0399"],
  ["Kappa", "\u039a"], ["Lambda", "\u039b"], ["Mu", "\u039c"],
  ["Nu", "\u039d"], ["Xi", "\u039e"], ["Omicron", "\u039f"],
  ["Pi", "\u03a0"], ["Rho", "\u03a1"], ["Sigma", "\u03a3"],
  ["Tau", "\u03a4"], ["Upsilon", "\u03a5"], ["Phi", "\u03a6"],
  ["Chi", "\u03a7"], ["Psi", "\u03a8"], ["Omega", "\u03a9"],
  ["alpha", "\u03b1"], ["beta", "\u03b2"], ["gamma", "\u03b3"],
  ["delta", "\u03b4"], ["epsilon", "\u03b5"], ["zeta", "\u03b6"],
  ["eta", "\u03b7"], ["theta", "\u03b8"], ["iota", "\u03b9"],
  ["kappa", "\u03ba"], ["lambda", "\u03bb"], ["mu", "\u03bc"],
  ["nu", "\u03bd"], ["xi", "\u03be"], ["omicron", "\u03bf"],
  ["pi", "\u03c0"], ["rho", "\u03c1"], ["sigma", "\u03c3"],
  ["tau", "\u03c4"], ["upsilon", "\u03c5"], ["phi", "\u03c6"],
  ["chi", "\u03c7"], ["psi", "\u03c8"], ["omega", "\u03c9"],
  // Misc
  ["iexcl", "\u00a1"], ["iquest", "\u00bf"],
  ["ordf", "\u00aa"], ["ordm", "\u00ba"],
  ["not", "\u00ac"], ["brvbar", "\u00a6"],
  ["shy", "\u00ad"], ["macr", "\u00af"],
  ["acute", "\u00b4"], ["cedil", "\u00b8"],
  ["uml", "\u00a8"], ["circ", "\u02c6"], ["tilde", "\u02dc"],
  // Special
  ["OElig", "\u0152"], ["oelig", "\u0153"],
  ["Scaron", "\u0160"], ["scaron", "\u0161"],
  ["Yuml", "\u0178"],
  ["fnof", "\u0192"],
  ["dagger", "\u2020"], ["Dagger", "\u2021"],
  ["permil", "\u2030"],
  ["loz", "\u25ca"],
  ["spades", "\u2660"], ["clubs", "\u2663"],
  ["hearts", "\u2665"], ["diams", "\u2666"],
  ["Sacute", "\u015a"], ["sacute", "\u015b"],
  ["Scedil", "\u015e"], ["scedil", "\u015f"],
  ["Tcedil", "\u0162"], ["tcedil", "\u0163"],
  ["Zacute", "\u0179"], ["zacute", "\u017a"],
  ["Zcaron", "\u017d"], ["zcaron", "\u017e"],
  ["Lacute", "\u0139"], ["lacute", "\u013a"],
  ["Lcaron", "\u013d"], ["lcaron", "\u013e"],
  ["Nacute", "\u0143"], ["nacute", "\u0144"],
  ["Ncaron", "\u0147"], ["ncaron", "\u0148"],
  ["Racute", "\u0154"], ["racute", "\u0155"],
  ["Rcaron", "\u0158"], ["rcaron", "\u0159"],
  ["Cacute", "\u0106"], ["cacute", "\u0107"],
  ["Ccaron", "\u010c"], ["ccaron", "\u010d"],
  ["Dcaron", "\u010e"], ["dcaron", "\u010f"],
  ["Ecaron", "\u011a"], ["ecaron", "\u011b"],
  ["EURO", "\u20ac"],
];

export const HTML_ENTITIES = new Map<string, string>();
for (const [name, char] of HTML_ENTITY_ENTRIES) {
  HTML_ENTITIES.set(`&${name};`, char);
  // Also support all-uppercase aliases, preserving the entity's canonical value.
  const upper = name.toUpperCase();
  if (upper !== name) {
    const upperEntity = `&${upper};`;
    if (!HTML_ENTITIES.has(upperEntity)) {
      HTML_ENTITIES.set(upperEntity, char);
    }
  }
}

export const HTML_ENTITY_RE = /&#?[0-9A-Za-z]{1,24};/g;
