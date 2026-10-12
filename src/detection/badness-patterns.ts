import { c1, bad, startPunct, endPunct, currency, numeric, law, endPunctBeforeLower, endPunctBeforeCurrency, numericBeforeStartPunct, kaomoji } from "./categories/symbols.js";
import { lowerAccented, upperAccented, box, lowerCommon, upperCommon, common } from "./categories/scripts.js";

/** Existence-test form of rules that begin with ASCII context (see badness.ts). */
export const contextRules = new Map<string, string>();

// The plain rule keeps its context in the match, so counts stay the same. The
// existence test moves the context into a lookbehind instead: every rule then
// starts with a non-ASCII character.
function afterContext(context: string, rule: string): string {
  contextRules.set(context + rule, `(?<=${context})${rule}`);
  return context + rule;
}

// fraction slash
export const badnessPatterns: string[] = [
  // Any C1 control character is bad
  `[${c1}]`,

  // Canonical UTF-8 mojibake that can otherwise look like standalone punctuation.
  `\u00ef\u00bb\u00bf`, // UTF-8 BOM read as Windows-1252
  `\u00e2\u201a\u00ac`, // euro sign read as Windows-1252
  `\u00ef\u00bf\u00bd`, // replacement character read as Windows-1252
  `\u00c2\u00bf`, // inverted question mark read as Windows-1252
  `\u043f\u00ac\u0403`, // UTF-8 fi ligature read as Windows-1251
  `\u201a\u00e0\u00f6\u00ac\u00a9`, // second layer of UTF-8 / MacRoman mojibake

  // "Bad" char adjacent to other suspicious chars
  `[${bad}${lowerAccented}${upperAccented}${box}${startPunct}${endPunct}${currency}${numeric}${law}][${bad}]`,
  `[${bad}][${lowerAccented}${upperAccented}${box}${startPunct}${endPunct}\u2019${currency}${numeric}${law}]`,

  // ASCII letter + Greek/Cyrillic + bad
  afterContext("[a-zA-Z]", `[${lowerCommon}${upperCommon}][${bad}]`),

  // Case violations with accented chars
  `[${lowerAccented}${lowerCommon}${box}${endPunct}${currency}${numeric}][${upperAccented}]`,

  // Symbol then lowercase accented
  `[${box}${endPunctBeforeLower}${currency}${numeric}][${lowerAccented}]`,

  // Lowercase/symbol then currency
  `[${lowerAccented}${box}${endPunctBeforeCurrency}][${currency}]`,

  // Uppercase accented + currency
  `[${upperAccented}][${currency}]`,

  // Uppercase accented/box + numeric/law
  `[${upperAccented}${box}][${numeric}${law}]`,

  // Complex 3-char patterns
  `[${lowerAccented}${upperAccented}${box}${currency}${endPunct}][${startPunct}][${numeric}]`,
  `[${lowerAccented}${upperAccented}${currency}${numeric}${box}${law}][${endPunct}][${startPunct}]`,
  `[${currency}${numericBeforeStartPunct}${box}][${startPunct}]`,
  afterContext("[a-z]", `[${upperAccented}][${startPunct}${currency}]`),

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

  // Windows-1252 specific 2-char mojibake: C2, C3, CE, D0 followed by common substitution chars,
  // including the encodings of sharp s, U/I/O with accents, Cyrillic Pe and Greek alpha-tonos
  `[\u00c2\u00c3\u00ce\u00d0][\u20ac\u0153\u0160\u0161\u0178\u017d\u017e\u00a0\u00a2\u00a3\u00ac\u00ad\u00ae\u00a9\u00b0\u00b7\u00bb${startPunct}${endPunct}\u2019\u2013\u2014\u00b4]`,

  // multiplication sign followed by superscript
  `\u00d7[\u00b2\u00b3]`,

  // Arabic mojibake (4-char pattern to avoid false positives)
  `[\u00d8\u00d9][${common}${currency}${bad}${numeric}${startPunct}\u00b0\u00b5][\u00d8\u00d9][${common}${currency}${bad}${numeric}${startPunct}\u00b0\u00b5]`,

  // Hebrew mojibake: require at least two adjacent UTF-8 byte pairs.
  `(?:\u00d7[\u0090-\u009f\u00a0-\u00aa\u02dc\u0153\u0161\u0178\u017e\u2013-\u2014\u2018-\u201d\u2022\u203a\u2122]){2,}`,

  // South Asian mojibake
  `\u00e0[\u00b2\u00b5\u00b9\u00bc\u00bd\u00be]`,

  // Single 3-byte UTF-8 mojibake candidates, used for short CJK/Hangul/etc.
  // Contextual guards prevent these from being decoded inside valid tokens.
  // A lead right after a Latin letter is a word ending in prose, such as an
  // accented letter before an ellipsis and a closing quote.
  `(?<![A-Za-z\u00c0-\u00ff\u1e00-\u1eff])[\u00e0-\u00ef][${common}${currency}${bad}${numeric}${startPunct}${endPunct}\u0152\u0153][${common}${currency}${bad}${numeric}${startPunct}${endPunct}\u0152\u0153]`,

  // MacRoman mojibake
  `\u221a[\u00b1\u2202\u2020\u2260\u00ae\u2122\u00b4\u2264\u2265\u00a5\u00b5\u00f8]`,
  `\u2248[\u00b0\u00a2]`,
  `\u201a\u00c4[\u00ec\u00ee\u00ef\u00f2\u00f4\u00fa\u00f9\u00fb\u2020\u00b0\u00a2\u03c0]`,
  `\u201a[\u00e2\u00f3][\u00e0\u00e4\u00b0\u00ea]`,

  // Windows-1251 Cyrillic mojibake
  `\u0432\u0402`,
  `[\u0412\u0413\u0420\u0421][${c1}${bad}${startPunct}${endPunct}\u2019${currency}\u00b0\u00b5][\u0412\u0413\u0420\u0421]`,

  // Specific C3 patterns for a-grave / a-acute
  `\u00c3[\u00a0\u00a1]`,
  afterContext("[a-z]\\s?", `[\u00c3\u00c2][ ]`),
  `^[\u00c3\u00c2][ ]`,
  afterContext(`[a-z.,?!${endPunct}\u2019] `, `\u00c2 [\\s${startPunct}${endPunct}\u2019]`),

  // Windows-1253 Greek mojibake
  `\u03b2\u20ac[\u2122\u00a0\u0386\u00ad\u00ae\u00b0]`,
  `[\u0392\u0393\u039e\u039f][${c1}${bad}${startPunct}${endPunct}\u2019${currency}\u00b0][\u0392\u0393\u039e\u039f]`,

  // Windows-1257 Baltic mojibake
  `\u0101\u20ac`,
];
