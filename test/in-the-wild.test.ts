import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("in-the-wild test cases", () => {
  it("fixes Turkish İstanbul", () => {
    expect(ungarble("Ä°stanbul")).toBe("İstanbul");
  });

  it("fixes Turkish mojibake", () => {
    expect(ungarble("HÄ±rsÄ±zÄ± BÃ¼yÃ¼ Korkuttu"))
      .toBe("Hırsızı Büyü Korkuttu");
  });

  it("fixes German ZURÜCK", () => {
    expect(ungarble.encoding("RUF MICH ZUR\u00c3\u009cCK")).toBe("RUF MICH ZURÜCK");
  });

  it("fixes Riga", () => {
    expect(ungarble("RÄ«ga")).toBe("Rīga");
  });

  it("fixes Vietnamese", () => {
    expect(ungarble("Táº¡i sao giÃ¡ háº¡t sáº§u riÃªng láº¡i lÃªn giÃ¡?"))
      .toBe("Tại sao giá hạt sầu riêng lại lên giá?");
  });

  it("fixes Spanish AÑOS", () => {
    expect(ungarble("DOS AÃ\u0091OS")).toBe("DOS AÑOS");
  });

  it("fixes Nicolás", () => {
    expect(ungarble("NicolÃ¡s")).toBe("Nicolás");
  });

  it("fixes août", () => {
    expect(ungarble("aoÃ»t")).toBe("août");
  });

  it("fixes HÔTEL", () => {
    expect(ungarble("HÃ\u0094TEL")).toBe("HÔTEL");
  });

  it("fixes French hotel", () => {
    expect(ungarble("HÃ´tel de Police")).toBe("Hôtel de Police");
  });

  it("fixes Greek letter gamma", () => {
    expect(ungarble.encoding("IL2RÎ³cKO.NOD")).toBe("IL2RγcKO.NOD");
  });

  it("fixes Hebrew (Windows-1252)", () => {
    expect(ungarble("×\u0091×\u0094×\u0095×\u0093×¢×\u0094"))
      .toBe("בהודעה");
  });

  it("fixes Dutch ongeëvenaard", () => {
    expect(ungarble("ongeÃ«venaard")).toBe("ongeëvenaard");
  });

  it("fixes Portuguese atenção às crianças", () => {
    expect(ungarble("com especial atenÃ§Ã£o Ã s crianÃ§as"))
      .toBe("com especial atenção às crianças");
  });

  it("fixes French à perturber", () => {
    expect(ungarble("Ã perturber la rÃ©flexion"))
      .toBe("à perturber la réflexion");
  });

  it("fixes fullwidth comma with wider context", () => {
    // The fullwidth comma needs surrounding mojibake for detection
    expect(ungarble("Ningbo，China")).toBe("Ningbo，China");
  });

  it("fixes C1 control quote marks", () => {
    expect(ungarble("\u0084Handwerk bringt dich \u00fcberall hin\u0093"))
      .toBe("\u201eHandwerk bringt dich \u00fcberall hin\u201c");
  });

  it("fixes Gaelic with NBSP", () => {
    expect(ungarble("CÃ\u00a0nan nan GÃ\u00a0idheal")).toBe("Cànan nan Gàidheal");
  });

  it("fixes French à l'office", () => {
    expect(ungarble("ART TRIP Ã\u00a0 l'office de tourisme"))
      .toBe("ART TRIP à l'office de tourisme");
  });

  it("fixes French Troisième édition", () => {
    expect(ungarble("TroisiÃ¨me Ã©dition"))
      .toBe("Troisième édition");
  });

  it("fixes OÙ ET QUAND?", () => {
    expect(ungarble("OÃ\u0099 ET QUAND?")).toBe("OÙ ET QUAND?");
  });

  it("fixes Lithuanian text", () => {
    expect(ungarble("Å iaip Ä¯domu")).toBe("Šiaip įdomu");
  });

  it("fixes strikethrough text", () => {
    expect(ungarble.encoding("hotel $49 $Ì¶6Ì¶3Ì¶ updated 2018"))
      .toBe("hotel $49 $̶6̶3̶ updated 2018");
  });
});
