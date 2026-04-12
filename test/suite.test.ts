import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

function testCase(c: {
  label: string;
  original: string;
  fixed: string;
  "fixed-encoding"?: string;
  expect: string;
}) {
  if (c.expect === "fail") return;

  it(c.label, () => {
    const expected = c["fixed-encoding"] ?? c.fixed;
    expect(ungarble.encoding(c.original)).toBe(expected);
  });
}

describe("in-the-wild", () => {
  const cases = [
    {
      label: "Low-codepoint emoji",
      original: "He's Justin\u2764",
      fixed: "He's Justin\u2764",
      expect: "pass",
    },
    {
      label: "UTF-8 / MacRoman mix-up about smurfs",
      original:
        "Le Schtroumpf Docteur conseille g\u221a\u00a2teaux et baies schtroumpfantes pour un r\u221a\u00a9gime \u221a\u00a9quilibr\u221a\u00a9.",
      fixed:
        "Le Schtroumpf Docteur conseille g\u00e2teaux et baies schtroumpfantes pour un r\u00e9gime \u00e9quilibr\u00e9.",
      expect: "pass",
    },
    {
      label: "Checkmark that almost looks okay as mojibake",
      original: "\u2714 No problems",
      fixed: "\u2714 No problems",
      expect: "pass",
    },
    {
      label: "Latin-1 / Windows-1252 mixup in Turkish",
      original: "Beta Haber: H\u00c4\u00b1rs\u00c4\u00b1z\u00c4\u00b1 B\u00c3\u00bcy\u00c3\u00bc Korkuttu",
      fixed: "Beta Haber: H\u0131rs\u0131z\u0131 B\u00fcy\u00fc Korkuttu",
      expect: "pass",
    },
    {
      label: "Latin-1 / Windows-1252 mixup in \u0130stanbul",
      original: "\u00c4\u00b0stanbul",
      fixed: "\u0130stanbul",
      expect: "pass",
    },
    {
      label: "Latin-1 / Windows-1252 mixup in R\u012bga",
      original: "R\u00c4\u00abga",
      fixed: "R\u012bga",
      expect: "pass",
    },
    {
      label: "UTF-8 / Windows-1252 mixed up twice in naming Iggy Pop",
      original: "Iggy Pop (n\u00c3\u0192\u00c2\u00a9 Jim Osterberg)",
      fixed: "Iggy Pop (n\u00e9 Jim Osterberg)",
      expect: "pass",
    },
    {
      label: "UTF-8 / Windows-1252 mixed up three times",
      original: "The Mona Lisa doesnÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢t have eyebrows.",
      "fixed-encoding": "The Mona Lisa doesn\u2019t have eyebrows.",
      fixed: "The Mona Lisa doesn\u2019t have eyebrows.",
      expect: "pass",
    },
    {
      label: "UTF-8 / Codepage 437 mixup in Russian",
      original: "#╨┐╤Ç╨░╨▓╨╕╨╗╤î╨╜╨╛╨╡╨┐╨╕╤é╨░╨╜╨╕╨╡",
      fixed: "#правильноепитание",
      expect: "pass",
    },
    {
      label: "UTF-8 / Windows-1252 mixup in French",
      original: "H\u00c3\u00b4tel de Police",
      fixed: "H\u00f4tel de Police",
      expect: "pass",
    },
    {
      label: "UTF-8 / Windows-1250 mixup in French",
      original: "Li\u0102\u00a8ge Avenue de l'H\u0102\u00b4pital",
      fixed: "Li\u00e8ge Avenue de l'H\u00f4pital",
      expect: "pass",
    },
    {
      label: "UTF-8 / Windows-1252 mixup in Vietnamese",
      original: "T\u00c3\u00a1\u00c2\u00ba\u00a1i sao gi\u00c3\u00a1 h\u00c3\u00a1\u00c2\u00ba\u00a1t s\u00c3\u00a1\u00c2\u00ba\u00a7u ri\u00c3\u00aang l\u00c3\u00a1\u00c2\u00ba\u00a1i l\u00c3\u00aan gi\u00c3\u00a1?",
      fixed: "T\u1ea1i sao gi\u00e1 h\u1ea1t s\u1ea7u ri\u00eang l\u1ea1i l\u00ean gi\u00e1?",
      expect: "pass",
    },
    {
      label: "UTF-8 / Windows-1252 mixup in Spanish",
      original: "DOS A\u00c3\u0091OS",
      fixed: "DOS A\u00d1OS",
      expect: "pass",
    },
    {
      label: "Nicol\u00e1s",
      original: "Nicol\u00c3\u00a1s",
      fixed: "Nicol\u00e1s",
      expect: "pass",
    },
    {
      label: "sharp S via MacRoman",
      original: "wei\u221a\u00fc",
      fixed: "wei\u00df",
      expect: "pass",
    },
    {
      label: "French non-breaking spaces",
      original: "ART TRIP \u00c3\u00a0 l'office de tourisme",
      fixed: "ART TRIP \u00e0 l'office de tourisme",
      expect: "pass",
    },
    {
      label: "Portuguese \u00e0s",
      original: "com especial aten\u00c3\u00a7\u00c3\u00a3o \u00c3 s crian\u00c3\u00a7as",
      fixed: "com especial aten\u00e7\u00e3o \u00e0s crian\u00e7as",
      expect: "pass",
    },
    {
      label: "\u00e0 perturber",
      original: "\u00c3 perturber la r\u00e9flexion des th\u00e9ologiens jusqu'\u00e0 nos jours",
      fixed: "\u00e0 perturber la r\u00e9flexion des th\u00e9ologiens jusqu'\u00e0 nos jours",
      expect: "pass",
    },
    {
      label: "Inconsistent mojibake in Portuguese",
      original: "Campeonatos > III DivisÃ£o - SÃ©rie F > Jornadas Classificação",
      fixed: "Campeonatos > III Divisão - Série F > Jornadas Classificação",
      expect: "pass",
    },
    {
      label: "Dutch onge\u00ebvenaard",
      original: "onge\u00c3\u00abvenaard",
      fixed: "onge\u00ebvenaard",
      expect: "pass",
    },
    {
      label: "Gaelic with NBSP",
      original: "C\u00c3\u00a0nan nan G\u00c3\u00a0idheal",
      fixed: "C\u00e0nan nan G\u00e0idheal",
      expect: "pass",
    },
    {
      label: "ao\u00fbt",
      original: "ao\u00c3\u00bbt",
      fixed: "ao\u00fbt",
      expect: "pass",
    },
    {
      label: "Italian MacRoman \u00f2",
      original: "Le Vigne di Zam\u221a\u2264",
      fixed: "Le Vigne di Zam\u00f2",
      expect: "pass",
    },
    {
      label: "H\u00d4TEL",
      original: "H\u00c3\u0094TEL",
      fixed: "H\u00d4TEL",
      expect: "pass",
    },
    {
      label: "Greek letter gamma in science",
      original: "IL2R\u00ce\u00b3cKO.NOD",
      fixed: "IL2R\u03b3cKO.NOD",
      expect: "pass",
    },
    {
      label: "CESU-8 emoji",
      original: "Hi guys \u00ed \u00bd\u00ed\u00b8\u008d",
      fixed: "Hi guys \ud83d\ude0d",
      expect: "pass",
    },
    {
      label: "Czech ISO-8859-2",
      original: "MĂĄm dost tĹ\u0099etĂ\u00adho tisĂ\u00adciletĂ\u00ad",
      fixed: "Mám dost třetího tisíciletí",
      expect: "pass",
    },
    {
      label: "O\u00d9 ET QUAND?",
      original: "O\u00c3\u0099 ET QUAND?",
      fixed: "O\u00d9 ET QUAND?",
      expect: "pass",
    },
  ];

  for (const c of cases) {
    testCase(c);
  }
});

describe("synthetic", () => {
  const cases = [
    {
      label: "voil\u00e0 le travail",
      original: "voil\u00c3\u00a0 le travail",
      fixed: "voil\u00e0 le travail",
      expect: "pass",
    },
    {
      label: "voil\u00e0 (space absorbed)",
      original: "voil\u00c3 le travail",
      fixed: "voil\u00e0 le travail",
      expect: "pass",
    },
    {
      label: "Arabic UTF-8 / Windows-1252",
      original: "\u00d8\u00b1\u00d8\u00b3\u00d8\u00a7\u00d9\u201e\u00d8\u00a9",
      fixed: "\u0631\u0633\u0627\u0644\u0629",
      expect: "pass",
    },
    {
      label: "Bronte negative",
      original: "I'm not such a fan of Charlotte Bront\u00eb\u2026\u201d",
      "fixed-encoding": "I'm not such a fan of Charlotte Bront\u00eb\u2026\u201d",
      fixed: "I'm not such a fan of Charlotte Bront\u00eb\u2026\"",
      expect: "pass",
    },
    {
      label: "AH\u0158 IKEA negative",
      original: "AH\u0158, the new sofa from IKEA",
      fixed: "AH\u0158, the new sofa from IKEA",
      expect: "pass",
    },
    {
      label: "Ukrainian WIKI negative",
      original: "\u0412\u0406\u041a\u0406 is Ukrainian for WIKI",
      fixed: "\u0412\u0406\u041a\u0406 is Ukrainian for WIKI",
      expect: "pass",
    },
    {
      label: "Hebrew UTF-8 / Latin-1 ABBA",
      original: "\u00d7\u0090\u00d7\u0091\u00d7\u0091\u00d7\u0090",
      fixed: "\u05d0\u05d1\u05d1\u05d0",
      expect: "pass",
    },
    {
      label: "Norwegian negative",
      original: "H\u00c5\u00d8YA ER BL\u00c5\u00d8YD",
      fixed: "H\u00c5\u00d8YA ER BL\u00c5\u00d8YD",
      expect: "pass",
    },
    {
      label: "Raised eyebrow kaomoji negative",
      original: "\u014c\u00aco",
      fixed: "\u014c\u00aco",
      expect: "pass",
    },
    {
      label: "C\u00d9IS",
      original: "C\u00c3\u0099IS",
      "fixed-encoding": "C\u00d9IS",
      fixed: "C\u00d9IS",
      expect: "pass",
    },
    {
      label: "NICIODATĂ\u00a0 negative",
      original: "NICIODATĂ\u00a0",
      fixed: "NICIODATĂ\u00a0",
      expect: "pass",
    },
    {
      label: "NICIODATĂ\u2122 negative",
      original: "NICIODATĂ\u2122",
      fixed: "NICIODATĂ\u2122",
      expect: "pass",
    },
  ];

  for (const c of cases) {
    testCase(c);
  }
});

describe("negative", () => {
  const cases = [
    { label: "Greek diaeresis quotes", original: "\u0397 \u00a8\u03b1\u03bd\u03b1\u03c4\u03c1\u03bf\u03c6\u03ae\u00a8 \u03b4\u03c5\u03c3\u03c4\u03c5\u03c7\u03ce\u03c2 \u03b1\u03c0\u03cc \u03c4\u03bf\u03c5\u03c2 \u03c0\u03c1\u03bf\u03c0\u03bf\u03bd\u03b7\u03c4\u03ad\u03c2", fixed: "\u0397 \u00a8\u03b1\u03bd\u03b1\u03c4\u03c1\u03bf\u03c6\u03ae\u00a8 \u03b4\u03c5\u03c3\u03c4\u03c5\u03c7\u03ce\u03c2 \u03b1\u03c0\u03cc \u03c4\u03bf\u03c5\u03c2 \u03c0\u03c1\u03bf\u03c0\u03bf\u03bd\u03b7\u03c4\u03ad\u03c2", expect: "pass" },
    { label: "Italian NBSP + e-grave", original: "Con il corpo e lo spirito ammaccato,\u00a0\u00e8 come se", fixed: "Con il corpo e lo spirito ammaccato,\u00a0\u00e8 come se", expect: "pass" },
    { label: "Multiplication and ellipsis", original: "4288\u00d7\u2026", fixed: "4288\u00d7\u2026", expect: "pass" },
    { label: "\u00d4\u00f4\u00f4 VIDA", original: "\u00d4\u00f4\u00f4 VIDA MINHA", fixed: "\u00d4\u00f4\u00f4 VIDA MINHA", expect: "pass" },
    { label: "NBSP + copyright", original: "[x]\u00a0\u00a9", fixed: "[x]\u00a0\u00a9", expect: "pass" },
    { label: "En dash + infinity", original: "2012\u2014\u221e", fixed: "2012\u2014\u221e", expect: "pass" },
    { label: "Ukrainian E", original: "\u0421\u0415\u041d\u0421\u0415 - Oleg Tsedryk", fixed: "\u0421\u0415\u041d\u0421\u0415 - Oleg Tsedryk", expect: "pass" },
    { label: "Angry face", original: "OK??:(   `\u00ac\u00b4    ):", fixed: "OK??:(   `\u00ac\u00b4    ):", expect: "pass" },
    { label: "Face with glasses", original: "( o\u00ac\u00f4 )", fixed: "( o\u00ac\u00f4 )", expect: "pass" },
    { label: "Triangle degree", original: "\u2206\u00b0", fixed: "\u2206\u00b0", expect: "pass" },
    { label: "Finnish \u00c4 + NBSP", original: "SELK\u00c4\u00a0EDELL\u00c4\u00a0MAAHAN via @YouTube", fixed: "SELK\u00c4\u00a0EDELL\u00c4\u00a0MAAHAN via @YouTube", expect: "pass" },
    { label: "Multiply currency", original: "Offering 5\u00d7\u00a335 pin ups", fixed: "Offering 5\u00d7\u00a335 pin ups", expect: "pass" },
    { label: "NESTLE registered", original: "NESTL\u00c9\u00ae requiere contratar personal", fixed: "NESTL\u00c9\u00ae requiere contratar personal", expect: "pass" },
    { label: "Connect A-macron + oslash", original: "Connect with \u0100\u00f8 on Facebook", fixed: "Connect with \u0100\u00f8 on Facebook", expect: "pass" },
    { label: "Math sqrt pi", original: "(-1/2)! = \u221a\u03c0", fixed: "(-1/2)! = \u221a\u03c0", expect: "pass" },
    { label: "C O N C L U S \u00c3 O", original: "C O N C L U S \u00c3 O", fixed: "C O N C L U S \u00c3 O", expect: "pass" },
    { label: "Leet line art", original: "├┤a┼¿a┼¿a┼¿a┼¿a", fixed: "├┤a┼¿a┼¿a┼¿a┼¿a", expect: "pass" },
    { label: "Portuguese inverted question", original: "ESSE CARA AI QUEM \u00c9\u00bf", fixed: "ESSE CARA AI QUEM \u00c9\u00bf", expect: "pass" },
    { label: "French C1 ellipsis not CJK", original: "beaucoup parl\u00e9\u0085 Tu sais", fixed: "beaucoup parl\u00e9\u2026 Tu sais", expect: "pass" },
    { label: "\u00d5 + ellipsis", original: "HUHLL \u00d5\u2026", fixed: "HUHLL \u00d5\u2026", expect: "pass" },
    { label: "\u00ca + ellipsis", original: "RETWEET SE VOC\u00ca\u2026", fixed: "RETWEET SE VOC\u00ca\u2026", expect: "pass" },
    { label: "\u00c9 + ellipsis", original: "PARCE QUE SUR LEURS PLAQUES IL Y MARQU\u00c9\u2026", fixed: "PARCE QUE SUR LEURS PLAQUES IL Y MARQU\u00c9\u2026", expect: "pass" },
    { label: "\u00d3 + ellipsis", original: "TEM QUE SEGUIR, SDV S\u00d3\u2026", fixed: "TEM QUE SEGUIR, SDV S\u00d3\u2026", expect: "pass" },
  ];

  for (const c of cases) {
    testCase(c);
  }
});

describe("language names", () => {
  const cases = [
    { label: "Czech", original: "ÄŒeÅ¡tina", fixed: "Čeština", expect: "pass" },
    { label: "Gaelic", original: "G\u00c3\u00a0idhlig", fixed: "G\u00e0idhlig", expect: "pass" },
    { label: "Lithuanian", original: "Lietuvi\u00c5\u00b3", fixed: "Lietuvi\u0173", expect: "pass" },
    { label: "Vietnamese", original: "Ti\u00c3\u00a1\u00c2\u00ba\u00bfng Vi\u00c3\u00a1\u00c2\u00bb\u2021t", fixed: "Ti\u1ebfng Vi\u1ec7t", expect: "pass" },
    { label: "Greek", original: "\u00ce\u0095\u00ce\u00bb\u00ce\u00bb\u00ce\u00b7\u00ce\u00bd\u00ce\u00b9\u00ce\u00ba\u00ce\u00ac", fixed: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac", expect: "pass" },
    { label: "Hebrew", original: "\u00d7\u00a2\u00d7\u0091\u00d7\u00a8\u00d7\u0099\u00d7\u00aa", fixed: "\u05e2\u05d1\u05e8\u05d9\u05ea", expect: "pass" },
    { label: "Thai", original: "à¸ à¸²à¸©à¸²à¹„à¸—à¸¢", fixed: "ภาษาไทย", expect: "pass" },
    { label: "Simplified Chinese", original: "\u00e7\u00ae\u0080\u00e4\u00bd\u0093\u00e4\u00b8\u00ad\u00e6\u2013\u2021", fixed: "\u7b80\u4f53\u4e2d\u6587", expect: "pass" },
    { label: "Japanese", original: "\u00e6\u2014\u00a5\u00e6\u0153\u00ac\u00e8\u00aa\u017e", fixed: "\u65e5\u672c\u8a9e", expect: "pass" },
    { label: "Korean", original: "\u00ed\u0095\u0153\u00ea\u00b5\u00ad\u00ec\u0096\u00b4", fixed: "\ud55c\uad6d\uc5b4", expect: "pass" },
    { label: "Czech via CP437", original: "\u2500\u00eee\u253c\u00edtina", fixed: "\u010ce\u0161tina", expect: "pass" },
  ];

  for (const c of cases) {
    testCase(c);
  }
});

describe("edge cases", () => {
  it("empty string", () => {
    expect(ungarble("")).toBe("");
  });

  it("single ASCII char", () => {
    expect(ungarble("a")).toBe("a");
  });

  it("pure ASCII sentence", () => {
    expect(ungarble("The quick brown fox jumps over the lazy dog.")).toBe(
      "The quick brown fox jumps over the lazy dog.",
    );
  });

  it("already valid UTF-8 accented text", () => {
    expect(ungarble("caf\u00e9")).toBe("caf\u00e9");
  });

  it("emoji only", () => {
    const text = "\ud83d\ude00\ud83c\udf0d\ud83c\udf89";
    expect(ungarble(text)).toBe(text);
  });

  it("CJK text", () => {
    const text = "\u65e5\u672c\u8a9e\u30c6\u30b9\u30c8\u4e2d\u6587\u6d4b\u8bd5\ud55c\uad6d\uc5b4";
    expect(ungarble(text)).toBe(text);
  });

  it("very long ASCII string", () => {
    const text = "hello world ".repeat(10000);
    expect(ungarble(text)).toBe(text);
  });

  it("string with only newlines", () => {
    expect(ungarble("\n\n\n")).toBe("\n\n\n");
  });

  it("string with only spaces", () => {
    expect(ungarble("   ")).toBe("   ");
  });

  it("null byte in string", () => {
    expect(ungarble("a\x00b")).toBe("ab");
  });

  it("tab and newline preserved", () => {
    expect(ungarble("a\tb\nc")).toBe("a\tb\nc");
  });

  it("CRLF normalized", () => {
    expect(ungarble("a\r\nb")).toBe("a\nb");
  });

  it("multiple fixes in one string", () => {
    // Mojibake + control char + CRLF
    expect(ungarble("caf\u00c3\u00a9\x00\r\n")).toBe("caf\u00e9\n");
  });

  it("BOM removal", () => {
    expect(ungarble("\ufeffhello")).toBe("hello");
  });

  it("flag emoji preserved", () => {
    const flag = "\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc77\udb40\udc6c\udb40\udc73\udb40\udc7f";
    expect(ungarble("dragon " + flag)).toBe("dragon " + flag);
  });

  it("supplementary plane characters preserved", () => {
    const text = "\ud835\udcb6 = \ud835\udcb7 + \ud835\udcb8"; // math italic
    expect(ungarble(text)).toBe(text);
  });

  it("mixed valid and mojibake on same line", () => {
    expect(ungarble("good caf\u00c3\u00a9 good")).toBe("good caf\u00e9 good");
  });

  it("idempotent: fixing twice gives same result", () => {
    const input = "Iggy Pop (n\u00c3\u0192\u00c2\u00a9 Jim Osterberg)";
    const once = ungarble(input);
    const twice = ungarble(once);
    expect(twice).toBe(once);
  });

  it("idempotent: valid text through multiple passes", () => {
    const text = "caf\u00e9 r\u00e9sum\u00e9 na\u00efve";
    for (let i = 0; i < 5; i++) {
      expect(ungarble(text)).toBe(text);
    }
  });
});
