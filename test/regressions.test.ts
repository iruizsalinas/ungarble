import { describe, expect, it } from "vitest";
import { ungarble } from "../src/index.js";

describe("regressions", () => {
  describe("chunk boundaries", () => {
    it("preserves surrogate pairs split at the default decode boundary", () => {
      const text = "a".repeat(999_999) + "😀";
      const fixed = ungarble(text);
      expect(fixed === text).toBe(true);
    });

    it("preserves surrogate pairs with small decode chunks", () => {
      expect(ungarble("abc😀def", { maxDecodeLength: 4 })).toBe("abc😀def");
    });

    it("does not split mojibake byte sequences across chunks", () => {
      expect(ungarble("cafÃ©", { maxDecodeLength: 4 })).toBe("café");
      expect(ungarble("Táº¡i", { maxDecodeLength: 2 })).toBe("Tại");
      expect(ungarble("ÄŒeÅ¡tina", { maxDecodeLength: 1 })).toBe("Čeština");
      expect(ungarble("ç®€ä½“ä¸­æ–‡", { maxDecodeLength: 2 })).toBe("简体中文");
      expect(ungarble("×¢×‘×¨×™×ª", { maxDecodeLength: 2 })).toBe("עברית");
      expect(ungarble("×¢×‘×¨×™×ª ×”×•×“×¢×”", { maxDecodeLength: 1 })).toBe("עברית הודעה");
      expect(ungarble("Ð ÑƒÑÑÐºÐ¸Ð¹ Ñ‚ÐµÐºÑÑ‚", { maxDecodeLength: 1 })).toBe("Русский текст");
    });

    it("does not split HTML entities needed by a later encoding fix", () => {
      expect(ungarble("caf&Atilde;&copy;", { maxDecodeLength: 10 })).toBe("café");
      expect(ungarble("&Atilde;&copy; ".repeat(4), { maxDecodeLength: 10 })).toBe("é ".repeat(4));
    });

    it("fixes mojibake made adjacent by chunked HTML or escape cleanup", () => {
      expect(ungarble("cafÃ&amp;copy;")).toBe("café");
      expect(ungarble("cafÃ&amp;copy;", { maxDecodeLength: 1 })).toBe("café");

      expect(ungarble("Ã\x1b[31m©")).toBe("é");
      expect(ungarble("Ã\x1b[31m©", { maxDecodeLength: 1 })).toBe("é");
    });

    it("uses consistent token boundaries around decoded HTML separators", () => {
      const input = "[😀RÄ«ga&amp;&#169;Âa! ";
      expect(ungarble(input)).toBe("[😀Rīga&©Âa! ");
      expect(ungarble(input, { maxDecodeLength: 1 })).toBe("[😀Rīga&©Âa! ");
    });
  });

  describe("explain parity", () => {
    const cases: Array<[string, Parameters<typeof ungarble>[1]]> = [
      ["10Î&frac14;s", undefined],
      ["caf&Atilde;&copy;", undefined],
      ["Jos&amp;#195;&amp;#169;", undefined],
      ["cafÃ©", { maxDecodeLength: 4 }],
    ];

    for (const [input, options] of cases) {
      it(`matches ungarble() for ${JSON.stringify(input)}`, () => {
        expect(ungarble.explain(input, options).text).toBe(ungarble(input, options));
      });
    }
  });

  describe("mixed clean and garbled text", () => {
    it("fixes mojibake embedded after non-single-byte Unicode", () => {
      expect(ungarble("😀 RÄ«ga")).toBe("😀 Rīga");
      expect(ungarble("한국어 RÄ«ga")).toBe("한국어 Rīga");
      expect(ungarble("😀한국어😍RÄ«ga")).toBe("😀한국어😍Rīga");
      expect(ungarble("Русский日本語JosÃ©\u0085 caf&Atilde;&copy;")).toBe("Русский日本語José… café");
    });

    it("fully fixes entity-encoded mojibake with tiny chunks in one call", () => {
      const input = "&#xe6;&#x97;&#165;&#230;&#156;&#172;&#xe8;&#170;&#158;";
      expect(ungarble(input, { maxDecodeLength: 1 })).toBe("日本語");

      const cyrillic = "&#xd0;&#xa0;&#209;&#131;&#209;&#129;&#xd1;&#x81;&#208;&#xba;&#xd0;&#184;&#208;&#185;&#x20;&#xd1;&#x82;&#208;&#181;&#208;&#186;&#209;&#129;&#209;&#130;";
      expect(ungarble(cyrillic, { maxDecodeLength: 8 })).toBe("Русский текст");
    });

    it("does not reinterpret repeated repaired chunks as new mojibake", () => {
      const atom = "&Atilde;&copy;\x1b[31mÃ©\x1b[0m\u0093Ã©\u0094";
      const input = atom.repeat(4);
      const expected = "éé“é”".repeat(4);

      expect(ungarble(input)).toBe(expected);
      for (const maxDecodeLength of [1, 2, 3, 10]) {
        expect(ungarble(input, { maxDecodeLength })).toBe(expected);
      }
    });
  });

  describe("terminal escapes", () => {
    it("removes private CSI sequences", () => {
      expect(ungarble("\x1b[?25lhidden")).toBe("hidden");
      expect(ungarble("\x1b[31mred", { maxDecodeLength: 1 })).toBe("red");
    });

    it("removes OSC sequences", () => {
      expect(ungarble("\x1b]0;title\x07x")).toBe("x");
      expect(ungarble("\x1b]0;title\x07x", { maxDecodeLength: 2 })).toBe("x");
    });

    it("keeps terminal escape wrappers with the escape chunk", () => {
      expect(ungarble("\x01\x1b[31mred", { maxDecodeLength: 1, controls: false })).toBe("red");
      expect(ungarble("\x1b[31m\x02red", { maxDecodeLength: 4, controls: false })).toBe("red");
      expect(ungarble("\x1b[31m\x02red", { controls: false })).toBe("red");
    });
  });

  describe("HTML entity aliases", () => {
    it("keeps uppercase aliases mapped to entity values", () => {
      expect(ungarble.html("&MICRO;")).toBe("µ");
      expect(ungarble.html("&SZLIG;")).toBe("ß");
      expect(ungarble.html("&SACUTE;")).toBe("Ś");
    });
  });
});
