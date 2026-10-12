import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

// A space can stand in for a damaged NBSP byte, so "é —" looks like E9 A0 97,
// a CJK character. In running text it is ordinary prose and must not change.
describe("do no harm - spaced punctuation after accented words", () => {
  it.each([
    "Le café — très bon — est ouvert.",
    "« J'ai mangé » dit-il.",
    "Il a été — comme toujours — en retard.",
    "Ele é — sem dúvida — o melhor.",
    "Così — disse — è la vita.",
    "Das Café “Müller” ist geschlossen.",
    "Résumé • Café • Thé",
    "Il prezzo è € 5",
    "Pelé ’70 World Cup",
    "Oekraïens — Italië — Oekraïne — Roemenië",
    "çex — isveç — rumın — gürcü",
    "Spojené štáty a Francúzsko",
    "ranskakielâ — saksakielâ",
  ])("preserves %j", text => {
    expect(ungarble(text)).toBe(text);
    expect(ungarble.encoding(text)).toBe(text);
    expect(ungarble(text, { chunk: 4 })).toBe(text);
  });

  it.each([
    "але і ми", "Ти і я", "де є вода", "це її книга", "без ґанку",
    "Все ёлки зелёные", "Мы пошли в кино и ёлку", "Ђорђе и Јована",
    "Тоа е ѓавол", "моја љубав и њена", "Сполучені Штати і Франція",
    "1 кілограм — 2 кілограми", "В’ячеслав і п’ять м’ясних об’єктів",
  ])("preserves Cyrillic %j", text => {
    expect(ungarble(text)).toBe(text);
    expect(ungarble.encoding(text)).toBe(text);
  });

  it("still restores a lost NBSP byte proven by a replacement character", () => {
    expect(ungarble.encoding("âš �")).toBe("⚠�");
    expect(ungarble.encoding("â €")).toBe("⠀");
  });
});

describe("detection on valid typography", () => {
  it.each([
    "l’Église et l’État", "L’ÉCOLE D’ÉTÉ", "the café’s owner", "José’s car and Zoë’s bike",
    "“Voilà…” she said", "the café—“a place”", "“Ṣé…”", "« Ṣé… »",
  ])("does not flag or change %j", text => {
    expect(ungarble.detect(text)).toBe(false);
    expect(ungarble.score(text)).toBe(0);
    expect(ungarble(text)).toBe(text);
  });
});
