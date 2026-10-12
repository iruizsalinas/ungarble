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

// Like ftfy, map every halfwidth and fullwidth form (fullwidth ASCII and
// currency signs, halfwidth katakana, Hangul and symbols) to its standard
// NFKC form. U+3000 IDEOGRAPHIC SPACE becomes an ASCII space as well.
export function buildWidthMap(): Map<number, string> {
  const map = new Map<number, string>([[0x3000, " "]]);
  for (let cp = 0xff01; cp <= 0xffef; cp++) {
    const char = String.fromCharCode(cp);
    const standard = char.normalize("NFKC");
    if (standard !== char) map.set(cp, standard);
  }
  return map;
}

export const WIDTH_MAP = buildWidthMap();
