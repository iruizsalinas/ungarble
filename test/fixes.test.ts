import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("individual fix functions", () => {
  describe("uncurlQuotes", () => {
    it("converts curly single quotes to straight", () => {
      expect(ungarble.quotes("it\u2019s")).toBe("it's");
    });

    it("converts curly double quotes to straight", () => {
      expect(ungarble.quotes("\u201chello\u201d")).toBe('"hello"');
    });

    it("converts low-9 quotes", () => {
      expect(ungarble.quotes("\u201ehello\u201c")).toBe('"hello"');
    });
  });

  describe("fixLatinLigatures", () => {
    it("expands fi ligature", () => {
      expect(ungarble.ligatures("\ufb01nd")).toBe("find");
    });

    it("expands fl ligature", () => {
      expect(ungarble.ligatures("\ufb02oor")).toBe("floor");
    });

    it("expands ff ligature", () => {
      expect(ungarble.ligatures("\ufb00ect")).toBe("ffect");
    });

    it("expands ffi ligature", () => {
      expect(ungarble.ligatures("\ufb03ce")).toBe("ffice");
    });

    it("expands ffl ligature", () => {
      expect(ungarble.ligatures("ra\ufb04e")).toBe("raffle");
    });

    it("expands IJ digraph", () => {
      expect(ungarble.ligatures("\u0132sselmeer")).toBe("IJsselmeer");
    });

    it("expands Afrikaans ʼn", () => {
      expect(ungarble.ligatures("\u0149 Chloroplas")).toBe("\u02bcn Chloroplas");
    });
  });

  describe("fixCharacterWidth", () => {
    it("normalizes fullwidth ASCII", () => {
      expect(ungarble.width("\uff21\uff22\uff23")).toBe("ABC");
    });

    it("normalizes fullwidth comma", () => {
      expect(ungarble.width("\uff0c")).toBe(",");
    });

    it("normalizes ideographic space", () => {
      expect(ungarble.width("A\u3000B")).toBe("A B");
    });
  });

  describe("fixLineBreaks", () => {
    it("normalizes CRLF", () => {
      expect(ungarble.lines("a\r\nb")).toBe("a\nb");
    });

    it("normalizes CR", () => {
      expect(ungarble.lines("a\rb")).toBe("a\nb");
    });

    it("normalizes Unicode line separator", () => {
      expect(ungarble.lines("a\u2028b")).toBe("a\nb");
    });

    it("normalizes Unicode paragraph separator", () => {
      expect(ungarble.lines("a\u2029b")).toBe("a\nb");
    });

    it("NEL is a C1 control, not a line break", () => {
      // U+0085 (NEL) is almost always Windows-1252 byte 0x85 = ellipsis
      expect(ungarble("a\u0085b")).toBe("a\u2026b");
    });
  });

  describe("fixSurrogates", () => {
    it("preserves valid surrogate pairs", () => {
      const text = "test 😀 test";
      expect(ungarble.surrogates(text)).toBe(text);
    });
  });

  describe("removeTerminalEscapes", () => {
    it("removes ANSI color sequences", () => {
      expect(ungarble.escapes("\x1b[31mred\x1b[0m")).toBe("red");
    });

    it("removes complex ANSI sequences", () => {
      expect(ungarble.escapes("\x01\x1b[36;44mfoo")).toBe("foo");
    });
  });

  describe("removeControlChars", () => {
    it("removes null bytes", () => {
      expect(ungarble.controls("a\x00b")).toBe("ab");
    });

    it("removes BOM", () => {
      expect(ungarble.controls("\ufeffhello")).toBe("hello");
    });

    it("preserves tabs and newlines", () => {
      expect(ungarble.controls("a\tb\nc")).toBe("a\tb\nc");
    });

    it("removes DEL", () => {
      expect(ungarble.controls("a\x7fb")).toBe("ab");
    });
  });

  describe("combined fixes via ungarble", () => {
    it("fixes BOM + control chars + line breaks", () => {
      expect(ungarble("\ufeffSometimes, \ufffcbad ideas \x7f\ufffalike these characters\ufffb \u206aget standardized.\r\n"))
        .toBe("Sometimes, bad ideas like these characters get standardized.\n");
    });

    it("handles terminal escapes in combined mode", () => {
      expect(ungarble("\x01\x1b[36;44mfoo")).toBe("foo");
    });
  });
});
