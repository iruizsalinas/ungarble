import { describe } from "vitest";
import { testCase } from "../../support/corpus-case.js";

describe("words and mixed-script repairs", () => {
  const cases = [
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
    }
  ];
  for (const c of cases) testCase(c);
});
