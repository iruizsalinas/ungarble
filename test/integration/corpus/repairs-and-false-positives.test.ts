import { describe } from "vitest";
import { testCase } from "../../support/corpus-case.js";

describe("repairs and false positives", () => {
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
    }
  ];
  for (const c of cases) testCase(c);
});
