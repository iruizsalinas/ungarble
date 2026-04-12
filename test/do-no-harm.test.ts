import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("do no harm - valid text must pass through unchanged", () => {
  describe("ASCII text", () => {
    it("preserves plain ASCII", () => {
      expect(ungarble("Hello, world!")).toBe("Hello, world!");
    });

    it("preserves empty string", () => {
      expect(ungarble("")).toBe("");
    });

    it("preserves single character", () => {
      expect(ungarble("a")).toBe("a");
    });

    it("preserves numbers and symbols", () => {
      expect(ungarble("Price: $99.99 (50% off)")).toBe("Price: $99.99 (50% off)");
    });
  });

  describe("valid Unicode text", () => {
    it("preserves French text", () => {
      const text = "L'\u00e9pisode 8 est trop fou ouahh";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Portuguese text", () => {
      const text = "RETWEET SE VOC\u00ca\u2026";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Charlotte Brontë", () => {
      // This is a classic false positive risk -- Ã« looks like mojibake
      const text = "I'm not such a fan of Charlotte Bront\u00eb\u2026\u201d";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Bremer/Mccoy – Dråber", () => {
      const text = "Bremer/Mccoy \u2013 Dr\u00e5ber";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Italian with NBSP", () => {
      const text = "Con il corpo e lo spirito ammaccato,\u00a0\u00e8 come se";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves ZZAJÉ's", () => {
      const text = "Join ZZAJ\u00c9's Official Fan List";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Ôôô VIDA", () => {
      const text = "\u00d4\u00f4\u00f4 VIDA MINHA";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves NESTLÉ® text", () => {
      const text = "NESTL\u00c9\u00ae requiere contratar personal";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves 2012—∞", () => {
      const text = "2012\u2014\u221e";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves SELKÄ EDELLÄ", () => {
      const text = "SELK\u00c4\u00a0EDELL\u00c4\u00a0MAAHAN";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves C O N C L U S Ã O", () => {
      const text = "C O N C L U S \u00c3 O";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves HÅØYA ER BLÅØYD", () => {
      const text = "H\u00c5\u00d8YA ER BL\u00c5\u00d8YD";
      expect(ungarble.encoding(text)).toBe(text);
    });
  });

  describe("emoji and CJK", () => {
    it("preserves emoji", () => {
      const text = "Hello 😀🌍🎉 world";
      expect(ungarble(text)).toBe(text);
    });

    it("preserves CJK characters", () => {
      const text = "日本語テスト中文测试한국어";
      expect(ungarble(text)).toBe(text);
    });

    it("preserves mixed emoji and text", () => {
      const text = "I ❤️ Unicode 🦄";
      expect(ungarble(text)).toBe(text);
    });
  });

  describe("math and symbols", () => {
    it("preserves math expressions", () => {
      const text = "(-1/2)! = √π";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves degree symbol in context", () => {
      const text = "∆°";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves multiplication in context", () => {
      const text = 'higher values ("+" and "×" curves)';
      expect(ungarble.encoding(text)).toBe(text);
    });
  });

  describe("kaomoji / emoticons", () => {
    it("preserves kaomoji with accented chars", () => {
      const text = "OK??:(   `¬´    ):";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves face emoticon", () => {
      const text = "( o¬ô )";
      expect(ungarble.encoding(text)).toBe(text);
    });
  });

  describe("text that superficially resembles mojibake", () => {
    it("preserves text with Ã used correctly", () => {
      const text = "There are a lot of Ã's in mojibake text";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves NICIODATĂ™", () => {
      const text = "NICIODATĂ™";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves TRANSFORMATORIŲ™", () => {
      const text = "TRANSFORMATORIŲ™";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves AHŘ IKEA", () => {
      const text = "AHŘ, the new sofa from IKEA";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Ukrainian ВІКІ", () => {
      const text = "ВІКІ is Ukrainian for WIKI";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves angstrom radius", () => {
      const text = "a radius of 10 Å—";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Offering 5×£35", () => {
      const text = "Offering 5×£35 pin ups";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Connect with Āø", () => {
      const text = "Connect with Āø on Facebook";
      expect(ungarble.encoding(text)).toBe(text);
    });
  });
});
