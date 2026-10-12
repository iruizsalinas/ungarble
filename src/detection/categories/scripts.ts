// O/U caron

// Uppercase accented Latin letters
export const upperAccented =
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
  "\u0490";

// Cyrillic Ghe with upturn

// Lowercase accented Latin letters
export const lowerAccented =
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
  "\u0491";

// Cyrillic ghe with upturn

// Uppercase Greek/Cyrillic
export const upperCommon =
  "\u00de" + // Thorn
  "\u0391-\u03a1\u03a3-\u03a9\u03aa\u03ab" + // Greek uppercase
  "\u0386\u0388-\u038a\u038c\u038e\u038f" + // Greek with tonos
  "\u0401-\u040f\u0410-\u042f";

// Cyrillic uppercase

// Lowercase Greek/Cyrillic
export const lowerCommon =
  "\u03b1-\u03c9\u03ca-\u03ce" + // Greek lowercase
  "\u0390" + // Greek small iota with dialytika and tonos
  "\u03b0" + // Greek small upsilon with dialytika and tonos
  "\u0430-\u044f\u0450-\u045f";

// Cyrillic lowercase

// Box drawing characters
export const box =
  "\u2500-\u257f" + // box drawing
  "\u2580-\u259f" + // block elements
  "\u25a0";

// black square

// Common (neutral) chars - their presence alone isn't suspicious
export const common =
  "\u00a0" + // NBSP
  "\u00ad" + // soft hyphen
  "\u00b7" + // middle dot
  "\u00b4" + // acute accent
  "\u2013" + // en dash
  "\u2014" + // em dash
  "\u2015" + // horizontal bar
  "\u2026" + // ellipsis
  "\u2019" + // right single quote
  "\u2044";
