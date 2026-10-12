import { describe } from "vitest";
import { testCase } from "../../support/corpus-case.js";

describe("real-world sentence repairs", () => {
  const cases = [
    {
      label: "Low-codepoint emoji",
      original: "He's Justinâ\u009d¤",
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
      original: "âœ” No problems",
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
    }
  ];
  for (const c of cases) testCase(c);
});
