import { describe, it, expect } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("regressions", () => {
  describe("mixed clean and garbled text", () => {
    it("fixes mojibake embedded after non-single-byte Unicode", () => {
      expect(ungarble("😀 RÄ«ga")).toBe("😀 Rīga");
      expect(ungarble("한국어 RÄ«ga")).toBe("한국어 Rīga");
      expect(ungarble("😀한국어😍RÄ«ga")).toBe("😀한국어😍Rīga");
      expect(ungarble("Русский日本語JosÃ©\u0085 caf&Atilde;&copy;")).toBe("Русский日本語José… café");
    });

    it("fully fixes entity-encoded mojibake with tiny chunks in one call", () => {
      const input = "&#xe6;&#x97;&#165;&#230;&#156;&#172;&#xe8;&#170;&#158;";
      expect(ungarble(input, { chunk: 1 })).toBe("日本語");

      const cyrillic = "&#xd0;&#xa0;&#209;&#131;&#209;&#129;&#xd1;&#x81;&#208;&#xba;&#xd0;&#184;&#208;&#185;&#x20;&#xd1;&#x82;&#208;&#181;&#208;&#186;&#209;&#129;&#209;&#130;";
      expect(ungarble(cyrillic, { chunk: 8 })).toBe("Русский текст");
    });

    it("does not reinterpret repeated repaired chunks as new mojibake", () => {
      const atom = "&Atilde;&copy;\x1b[31mÃ©\x1b[0m\u0093Ã©\u0094";
      const input = atom.repeat(4);
      const expected = "éé“é”".repeat(4);

      expect(ungarble(input)).toBe(expected);
      for (const chunk of [1, 2, 3, 10]) {
        expect(ungarble(input, { chunk })).toBe(expected);
      }
    });
  });

  describe("terminal escapes", () => {
    it("removes private CSI sequences", () => {
      expect(ungarble("\x1b[?25lhidden")).toBe("hidden");
      expect(ungarble("\x1b[31mred", { chunk: 1 })).toBe("red");
    });

    it("removes OSC sequences", () => {
      expect(ungarble("\x1b]0;title\x07x")).toBe("x");
      expect(ungarble("\x1b]0;title\x07x", { chunk: 2 })).toBe("x");
    });

    it("keeps terminal escape wrappers with the escape chunk", () => {
      expect(ungarble("\x01\x1b[31mred", { chunk: 1, controls: false })).toBe("red");
      expect(ungarble("\x1b[31m\x02red", { chunk: 4, controls: false })).toBe("red");
      expect(ungarble("\x1b[31m\x02red", { controls: false })).toBe("red");
    });

    it("handles repeated unterminated OSC starts with tiny chunks", () => {
      const input = "\x1b]a".repeat(1000);
      expect(ungarble(input, {
        html: false,
        encoding: false,
        escapes: true,
        controls: false,
        chunk: 1,
      })).toBe(input);
    });
  });

  describe("HTML entity aliases", () => {
    it("keeps uppercase aliases mapped to entity values", () => {
      expect(ungarble.html("&MICRO;")).toBe("µ");
      expect(ungarble.html("&SZLIG;")).toBe("ß");
      expect(ungarble.html("&SACUTE;")).toBe("Ś");
    });
  });

  describe("do no harm", () => {
    it("does not decode valid ligature and copyright text as MacRoman", () => {
      expect(ungarble("ﬁ©a")).toBe("ﬁ©a");
      expect(ungarble("ﬂ©a")).toBe("ﬂ©a");
      expect(ungarble.detect("ﬁ©a")).toBe(false);
    });

    it("does not decode valid curly quote before accented text as MacRoman", () => {
      expect(ungarble("l’été")).toBe("l’été");
      expect(ungarble("d’été")).toBe("d’été");
      expect(ungarble("’é")).toBe("’é");
      expect(ungarble("â€™é")).toBe("’é");
    });

    it("does not decode isolated non-Latin byte-looking symbol pairs", () => {
      expect(ungarble("×‘single’")).toBe("×‘single’");
      expect(ungarble("×Łódź")).toBe("×Łódź");
      expect(ungarble("“quote”£")).toBe("“quote”£");
      expect(ungarble("voilà¥ voilà")).toBe("voilà¥ voilà");
      expect(ungarble("world÷àZażółć")).toBe("world÷àZażółć");
      expect(ungarble("café¥½…ação")).toBe("café¥½…ação");
      expect(ungarble("÷©…àsplain")).toBe("÷©…àsplain");
    });

    it("repairs short standalone and mixed non-Latin mojibake", () => {
      expect(ungarble("æ—¥")).toBe("日");
      expect(ungarble("í•œ")).toBe("한");
      expect(ungarble("Japanese: æ—¥.")).toBe("Japanese: 日.");
      expect(ungarble("æ—¥í•œ")).toBe("日한");
      expect(ungarble("æ—¥ðŸ˜€")).toBe("日😀");
      expect(ungarble("Ù…Ø±Ø­Ø¨Ø§ æ—¥")).toBe("مرحبا 日");
      expect(ungarble("à¤¹à¤¿æ—¥")).toBe("हि日");
    });

    it("keeps covered non-Latin and emoji mojibake repairs", () => {
      expect(ungarble("×¢×‘×¨×™×ª")).toBe("עברית");
      expect(ungarble("Ù…Ø±Ø­Ø¨Ø§")).toBe("مرحبا");
      expect(ungarble("à¸ à¸²à¸©à¸²à¹„à¸—à¸¢")).toBe("ภาษาไทย");
      expect(ungarble("à¤¹à¤¿à¤¨à¥à¤¦à¥€")).toBe("हिन्दी");
      expect(ungarble("ç®ä½“ä¸­æ–‡")).toBe("简体中文");
      expect(ungarble("æ—¥æœ¬èªž")).toBe("日本語");
      expect(ungarble("í•œêµ­ì–´")).toBe("한국어");
      expect(ungarble("ðŸ˜€")).toBe("😀");
    });
  });
});
