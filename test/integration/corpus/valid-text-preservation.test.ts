import { describe } from "vitest";
import { testCase } from "../../support/corpus-case.js";

describe("valid text preservation", () => {
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
    { label: "\u00d3 + ellipsis", original: "TEM QUE SEGUIR, SDV S\u00d3\u2026", fixed: "TEM QUE SEGUIR, SDV S\u00d3\u2026", expect: "pass" }
  ];
  for (const c of cases) testCase(c);
});
