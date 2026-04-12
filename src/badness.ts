// Character categories and regex for detecting mojibake sequences.

// C1 control characters (U+0080-U+009F) -- almost never intentional
const c1 = "\u0080-\u009f";

// Characters that are near-certain mojibake indicators
const bad =
  "\u00a6" + // broken bar
  "\u00a4" + // currency sign
  "\u00a8" + // diaeresis
  "\u00af" + // macron
  "\u00b8" + // cedilla
  "\u0192" + // latin small f with hook
  "\u02c6" + // modifier letter circumflex accent
  "\u02c7" + // caron
  "\u02d8" + // breve
  "\u02db" + // ogonek
  "\u02dc" + // small tilde
  "\u2020" + // dagger
  "\u2021" + // double dagger
  "\u2030" + // per mille sign
  "\u25ca" + // lozenge
  "\ufffd" + // replacement character
  "\u00aa" + // feminine ordinal
  "\u00ba";  // masculine ordinal

// Legal symbols
const law = "\u00b6\u00a7"; // pilcrow, section

// Currency symbols
const currency = "\u00a2\u00a3\u00a5\u20a7\u20ac"; // cent, pound, yen, peseta, euro

// Opening/start punctuation
const startPunct =
  "\u00a1" + // inverted exclamation
  "\u00ab" + // left guillemet
  "\u00a9" + // copyright
  "\u0384" + // Greek tonos
  "\u0385" + // Greek dialytika tonos
  "\u2018" + // left single quote
  "\u201a" + // single low-9 quote
  "\u201c" + // left double quote
  "\u201e" + // double low-9 quote
  "\u2022" + // bullet
  "\uf8ff";  // Apple logo

// Closing/end punctuation
const endPunct =
  "\u00ae" + // registered
  "\u00bb" + // right guillemet
  "\u02dd" + // double acute
  "\u201d" + // right double quote
  "\u2019" + // right single quote
  "\u203a" + // right single angle quote
  "\u2122";  // trademark

// Numeric/math symbols
const numeric =
  "\u00b2\u00b3\u00b9" + // superscripts 2, 3, 1
  "\u00b1" +              // plus-minus
  "\u00bc\u00bd\u00be" + // fractions 1/4, 1/2, 3/4
  "\u00d7" +              // multiplication
  "\u00b5" +              // micro
  "\u00f7" +              // division
  "\u2202" +              // partial differential
  "\u2206" +              // increment (delta)
  "\u220f" +              // n-ary product
  "\u2211" +              // n-ary summation
  "\u221a" +              // square root
  "\u221e" +              // infinity
  "\u222b" +              // integral
  "\u2248" +              // almost equal
  "\u2260" +              // not equal
  "\u2264" +              // less than or equal
  "\u2265" +              // greater than or equal
  "\u2116" +              // numero sign
  "\u2310";               // reversed not

// Kaomoji characters -- accented o's, u's, degree used in emoticons
const kaomoji =
  "\u00d2-\u00d6" + // O with various accents
  "\u00d9-\u00dc" + // U with various accents
  "\u00b0" +        // degree
  "\u0150\u0170" +  // O/U double acute
  "\u014c\u016a" +  // O/U macron
  "\u01d1\u01d3";   // O/U caron

// Uppercase accented Latin letters
const upperAccented =
  "\u00c0-\u00c5" + // A with accents
  "\u00c7-\u00cf" + // C-I with accents
  "\u00d1" +        // N tilde
  "\u0100\u0102\u0104\u0106\u010c\u010e\u0110" + // Central European
  "\u0112\u0116\u0118\u011a" + // E variants
  "\u0122" +        // G cedilla
  "\u012a\u012e\u0130" + // I variants
  "\u0136\u0139\u013b\u013d\u0141\u0143\u0145\u0147" + // K-N variants
  "\u0150\u0154\u0156\u0158" + // O-R variants
  "\u015a\u015e\u0160\u0162\u0164" + // S-T variants
  "\u016a\u016e\u0170\u0172" + // U variants
  "\u0178\u0179\u017b\u017d" + // Y-Z variants
  "\u0490";  // Cyrillic Ghe with upturn

// Lowercase accented Latin letters
const lowerAccented =
  "\u00df" +        // sharp s
  "\u00e0-\u00e5" + // a with accents
  "\u00e7-\u00ef" + // c-i with accents
  "\u00f1-\u00f6" + // n-o with accents
  "\u00f8-\u00fe" + // o-thorn
  "\u0101\u0103\u0105\u0107\u010d\u010f\u0111" + // Central European
  "\u0113\u0117\u0119\u011b" + // e variants
  "\u0123" +        // g cedilla
  "\u012b\u012f\u0131" + // i variants
  "\u0137\u013a\u013c\u013e\u0142\u0144\u0146\u0148" + // k-n
  "\u0151\u0155\u0157\u0159" + // o-r
  "\u015b\u015f\u0161\u0163\u0165" + // s-t
  "\u016b\u016f\u0171\u0173" + // u
  "\u017a\u017c\u017e" + // z
  "\u0491" + // Cyrillic ghe with upturn
  "\ufb01\ufb02"; // fi, fl ligatures

// Uppercase Greek/Cyrillic
const upperCommon =
  "\u00de" + // Thorn
  "\u0391-\u03a1\u03a3-\u03a9\u03aa\u03ab" + // Greek uppercase
  "\u0386\u0388-\u038a\u038c\u038e\u038f" + // Greek with tonos
  "\u0401-\u040f\u0410-\u042f"; // Cyrillic uppercase

// Lowercase Greek/Cyrillic
const lowerCommon =
  "\u03b1-\u03c9\u03ca-\u03ce" + // Greek lowercase
  "\u0390" + // Greek small iota with dialytika and tonos
  "\u03b0" + // Greek small upsilon with dialytika and tonos
  "\u0430-\u044f\u0450-\u045f"; // Cyrillic lowercase

// Box drawing characters
const box =
  "\u2500-\u257f" + // box drawing
  "\u2580-\u259f" + // block elements
  "\u25a0";         // black square

// Common (neutral) chars - their presence alone isn't suspicious
const common =
  "\u00a0" + // NBSP
  "\u00ad" + // soft hyphen
  "\u00b7" + // middle dot
  "\u00b4" + // acute accent
  "\u2013" + // en dash
  "\u2014" + // em dash
  "\u2015" + // horizontal bar
  "\u2026" + // ellipsis
  "\u2044";  // fraction slash

const badnessPatterns: string[] = [
  // Any C1 control character is bad
  `[${c1}]`,

  // "Bad" char adjacent to other suspicious chars
  `[${bad}${lowerAccented}${upperAccented}${box}${startPunct}${endPunct}${currency}${numeric}${law}][${bad}]`,
  `[${bad}][${lowerAccented}${upperAccented}${box}${startPunct}${endPunct}${currency}${numeric}${law}]`,

  // ASCII letter + Greek/Cyrillic + bad
  `[a-zA-Z][${lowerCommon}${upperCommon}][${bad}]`,

  // Case violations with accented chars
  `[${lowerAccented}${lowerCommon}${box}${endPunct}${currency}${numeric}][${upperAccented}]`,

  // Symbol then lowercase accented
  `[${box}${endPunct}${currency}${numeric}][${lowerAccented}]`,

  // Lowercase/symbol then currency
  `[${lowerAccented}${box}${endPunct}][${currency}]`,

  // Uppercase accented + currency
  `[${upperAccented}][${currency}]`,

  // Uppercase accented/box + numeric/law
  `[${upperAccented}${box}][${numeric}${law}]`,

  // Complex 3-char patterns
  `[${lowerAccented}${upperAccented}${box}${currency}${endPunct}][${startPunct}][${numeric}]`,
  `[${lowerAccented}${upperAccented}${currency}${numeric}${box}${law}][${endPunct}][${startPunct}]`,
  `[${currency}${numeric}${box}][${startPunct}]`,
  `[a-z][${upperAccented}][${startPunct}${currency}]`,

  // Box drawing mismatches
  `[${box}][${kaomoji}]`,
  `[${lowerAccented}${upperAccented}${currency}${numeric}${startPunct}${endPunct}${law}][${box}]`,
  `[${box}][${endPunct}]`,

  // Accented + punctuation + word char
  `[${lowerAccented}${upperAccented}][${startPunct}${endPunct}]\\w`,

  // OE ligature before non-Latin
  `[\u0152\u0153][^A-Za-z]`,

  // Degree after uppercase accented
  `[${upperAccented}]\u00b0`,

  // Windows-1252 specific 2-char mojibake: C2, C3, CE, D0 followed by common substitution chars
  `[\u00c2\u00c3\u00ce\u00d0][\u20ac\u0153\u0160\u00a0\u00ad\u00ae\u00a9\u00b0\u00b7\u00bb${startPunct}${endPunct}\u2013\u2014\u00b4]`,

  // multiplication sign followed by superscript
  `\u00d7[\u00b2\u00b3]`,

  // Arabic mojibake (4-char pattern to avoid false positives)
  `[\u00d8\u00d9][${common}${currency}${bad}${numeric}${startPunct}\u00b0\u00b5][\u00d8\u00d9][${common}${currency}${bad}${numeric}${startPunct}\u00b0\u00b5]`,

  // South Asian mojibake
  `\u00e0[\u00b2\u00b5\u00b9\u00bc\u00bd\u00be]`,

  // MacRoman mojibake
  `\u221a[\u00b1\u2202\u2020\u2260\u00ae\u2122\u00b4\u2264\u2265\u00a5\u00b5\u00f8]`,
  `\u2248[\u00b0\u00a2]`,
  `\u201a\u00c4[\u00ec\u00ee\u00ef\u00f2\u00f4\u00fa\u00f9\u00fb\u2020\u00b0\u00a2\u03c0]`,
  `\u201a[\u00e2\u00f3][\u00e0\u00e4\u00b0\u00ea]`,

  // Windows-1251 Cyrillic mojibake
  `\u0432\u0402`,
  `[\u0412\u0413\u0420\u0421][${c1}${bad}${startPunct}${endPunct}${currency}\u00b0\u00b5][\u0412\u0413\u0420\u0421]`,

  // Specific C3 patterns for a-grave / a-acute
  `\u00c3[\u00a0\u00a1]`,
  `[a-z]\\s?[\u00c3\u00c2][ ]`,
  `^[\u00c3\u00c2][ ]`,
  `[a-z.,?!${endPunct}] \u00c2 [\\s${startPunct}${endPunct}]`,

  // Windows-1253 Greek mojibake
  `\u03b2\u20ac[\u2122\u00a0\u0386\u00ad\u00ae\u00b0]`,
  `[\u0392\u0393\u039e\u039f][${c1}${bad}${startPunct}${endPunct}${currency}\u00b0][\u0392\u0393\u039e\u039f]`,

  // Windows-1257 Baltic mojibake
  `\u0101\u20ac`,
];

export const BADNESS_RE = new RegExp(badnessPatterns.join("|"), "gu");

export function badness(text: string): number {
  let count = 0;
  BADNESS_RE.lastIndex = 0;
  while (BADNESS_RE.exec(text)) count++;
  return count;
}

export function isBad(text: string): boolean {
  BADNESS_RE.lastIndex = 0;
  return BADNESS_RE.test(text);
}
