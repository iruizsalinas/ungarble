import { describe, it, expect } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("regressions", () => {
  describe("input limit", () => {
    it("is unlimited by default", () => {
      const input = "a".repeat(1_000_001);
      expect(ungarble(input)).toBe(input);
    });

    it("accepts input exactly at the configured limit", () => {
      expect(ungarble("cafÃ©", { limit: 5 })).toBe("café");
    });

    it("throws before processing input over the configured limit", () => {
      expect(() => ungarble("cafÃ©", { limit: 4 })).toThrow(
        new RangeError("Input length 5 exceeds the configured limit of 4 UTF-16 code units."),
      );
      expect(() => ungarble.explain("abcdef", { limit: 5 })).toThrow(RangeError);
    });

    it("measures UTF-16 code units", () => {
      expect(() => ungarble("😀", { limit: 1 })).toThrow(RangeError);
      expect(ungarble("😀", { limit: 2 })).toBe("😀");
    });

    it("rejects invalid limits", () => {
      expect(() => ungarble("text", { limit: -1 })).toThrow(RangeError);
      expect(() => ungarble("text", { limit: NaN })).toThrow(RangeError);
    });

    it("rejects limits with the wrong runtime type", () => {
      expect(() => ungarble("text", { limit: "large" } as unknown as Parameters<typeof ungarble>[1]))
        .toThrow(new TypeError('Option "limit" must be a number.'));
    });

    it("treats an explicit undefined limit as omitted", () => {
      expect(ungarble("text", { limit: undefined })).toBe("text");
    });
  });

  describe("chunk boundaries", () => {
    it("preserves surrogate pairs split at the default decode boundary", () => {
      const text = "a".repeat(999_999) + "😀";
      const fixed = ungarble(text);
      expect(fixed === text).toBe(true);
    });

    it("preserves surrogate pairs with small decode chunks", () => {
      expect(ungarble("abc😀def", { chunk: 4 })).toBe("abc😀def");
    });

    it("does not split mojibake byte sequences across chunks", () => {
      expect(ungarble("cafÃ©", { chunk: 4 })).toBe("café");
      expect(ungarble("Táº¡i", { chunk: 2 })).toBe("Tại");
      expect(ungarble("ÄŒeÅ¡tina", { chunk: 1 })).toBe("Čeština");
      expect(ungarble("ç®€ä½“ä¸­æ–‡", { chunk: 2 })).toBe("简体中文");
      expect(ungarble("×¢×‘×¨×™×ª", { chunk: 2 })).toBe("עברית");
      expect(ungarble("×¢×‘×¨×™×ª ×”×•×“×¢×”", { chunk: 1 })).toBe("עברית הודעה");
      expect(ungarble("Ð ÑƒÑÑÐºÐ¸Ð¹ Ñ‚ÐµÐºÑÑ‚", { chunk: 1 })).toBe("Русский текст");
    });

    it("does not split HTML entities needed by a later encoding fix", () => {
      expect(ungarble("caf&Atilde;&copy;", { chunk: 10 })).toBe("café");
      expect(ungarble("&Atilde;&copy; ".repeat(4), { chunk: 10 })).toBe("é ".repeat(4));
    });

    it("fixes mojibake made adjacent by chunked HTML or escape cleanup", () => {
      expect(ungarble("cafÃ&amp;copy;")).toBe("café");
      expect(ungarble("cafÃ&amp;copy;", { chunk: 1 })).toBe("café");

      expect(ungarble("Ã\x1b[31m©")).toBe("é");
      expect(ungarble("Ã\x1b[31m©", { chunk: 1 })).toBe("é");
    });

    it("uses consistent token boundaries around decoded HTML separators", () => {
      const input = "[😀RÄ«ga&amp;&#169;Âa! ";
      expect(ungarble(input)).toBe("[😀Rīga&©Âa! ");
      expect(ungarble(input, { chunk: 1 })).toBe("[😀Rīga&©Âa! ");
    });

    it("defers normalization until after chunk repair", () => {
      expect(ungarble("caf&Atilde;&copy;", { chunk: 8, normalization: "NFD" })).toBe("café");
      expect(ungarble("Ã\x1b[31m©", { chunk: 1, normalization: "NFD" })).toBe("é");
    });

    it("handles incomplete HTML entities with tiny chunks", () => {
      expect(ungarble("&".repeat(1000), { html: true, encoding: false, escapes: false, chunk: 1 }))
        .toBe("&".repeat(1000));
      expect(ungarble("&" + "a".repeat(999), { html: true, encoding: false, escapes: false, chunk: 1 }))
        .toBe("&" + "a".repeat(999));
    });
  });

  describe("explain parity", () => {
    const cases: Array<[string, Parameters<typeof ungarble>[1]]> = [
      ["10Î&frac14;s", undefined],
      ["caf&Atilde;&copy;", undefined],
      ["Jos&amp;#195;&amp;#169;", undefined],
      ["cafÃ©", { chunk: 4 }],
      ["ï»¿", undefined],
      ["10ÃŽ&frac14;s", undefined],
      ["Ã¢â€�â€™(Ã¢Å’Â£Ã‹â€ºÃ¢Å’Â£)Ã¢â€�Å½", undefined],
      ["There are a lot of Ã’s in mojibake text", undefined],
    ];

    for (const [input, options] of cases) {
      it(`matches ungarble() for ${JSON.stringify(input)}`, () => {
        expect(ungarble.explain(input, options).text).toBe(ungarble(input, options));
      });
    }
  });
});
