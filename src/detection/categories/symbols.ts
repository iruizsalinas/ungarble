// Character categories and regex for detecting mojibake sequences.

// C1 control characters (U+0080-U+009F) -- almost never intentional
export const c1 = "\u0080-\u009f";

// Characters that are near-certain mojibake indicators
export const bad =
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
  "\u00ba";

// masculine ordinal

// Legal symbols
export const law = "\u00b6\u00a7";

// pilcrow, section

// Currency symbols
export const currency = "\u00a2\u00a3\u00a5\u20a7\u20ac";

// cent, pound, yen, peseta, euro

// Opening/start punctuation
export const startPunct =
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
  "\uf8ff";

// Apple logo

// Closing/end punctuation. The right single quote is "common" instead: as an
// apostrophe it follows accented letters in valid French elisions and English
// possessives.
export const endPunct =
  "\u00ae" + // registered
  "\u00bb" + // right guillemet
  "\u02dd" + // double acute
  "\u201d" + // right double quote
  "\u203a" + // right single angle quote
  "\u2122";

// trademark
export const endPunctBeforeLower = endPunct.replace("\u201d", "").replace("\u2019", "");

export const endPunctBeforeCurrency = endPunct.replace("\u201d", "").replace("\u2019", "");

// Numeric/math symbols
export const numeric =
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
  "\u2310";

// reversed not
export const numericBeforeStartPunct = numeric.replace("\u00d7", "");

// Kaomoji characters -- accented o's, u's, degree used in emoticons
export const kaomoji =
  "\u00d2-\u00d6" + // O with various accents
  "\u00d9-\u00dc" + // U with various accents
  "\u00b0" +        // degree
  "\u0150\u0170" +  // O/U double acute
  "\u014c\u016a" +  // O/U macron
  "\u01d1\u01d3";
