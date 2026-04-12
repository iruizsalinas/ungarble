import { describe, it, expect } from "vitest";
import { ungarble } from "../src/index.js";

describe("ungarble", () => {
  describe("basic encoding fixes", () => {
    it("fixes UTF-8 decoded as Latin-1", () => {
      expect(ungarble("JosÃ©")).toBe("José");
    });

    it("fixes UTF-8 decoded as Windows-1252", () => {
      expect(ungarble("HÃ´tel de Police")).toBe("Hôtel de Police");
    });

    it("passes through clean text unchanged", () => {
      expect(ungarble("already fine")).toBe("already fine");
    });

    it("passes through ASCII unchanged", () => {
      expect(ungarble("hello world")).toBe("hello world");
    });

    it("passes through empty string", () => {
      expect(ungarble("")).toBe("");
    });

    it("fixes Turkish text", () => {
      expect(ungarble("Ä°stanbul")).toBe("İstanbul");
    });

    it("fixes French hotel", () => {
      expect(ungarble("HÃ´tel de Police")).toBe("Hôtel de Police");
    });

    it("fixes German text", () => {
      expect(ungarble.encoding("RUF MICH ZUR\u00c3\u009cCK")).toBe("RUF MICH ZURÜCK");
    });

    it("fixes Riga", () => {
      expect(ungarble("RÄ«ga")).toBe("Rīga");
    });

    it("fixes Vietnamese text", () => {
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
  });

  describe("double encoding", () => {
    it("fixes double-encoded text", () => {
      expect(ungarble("Iggy Pop (nÃƒÂ© Jim Osterberg)"))
        .toBe("Iggy Pop (né Jim Osterberg)");
    });

    it("fixes triple-encoded text", () => {
      expect(ungarble("The Mona Lisa doesnÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢t have eyebrows."))
        .toBe("The Mona Lisa doesn\u2019t have eyebrows.");
    });
  });

  describe("do no harm - valid text unchanged", () => {
    it("preserves clean French text", () => {
      const text = "L'\u00e9pisode 8 est trop fou ouahh";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Portuguese text", () => {
      const text = "RETWEET SE VOC\u00ca\u2026";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves text with degree symbol", () => {
      expect(ungarble.encoding("\u2206\u00b0")).toBe("\u2206\u00b0");
    });

    it("preserves emoji", () => {
      const text = "Hello 😀 world 🌍";
      expect(ungarble(text)).toBe(text);
    });

    it("preserves CJK text", () => {
      const text = "日本語テスト";
      expect(ungarble(text)).toBe(text);
    });
  });

  describe("badness detection", () => {
    it("detects C1 control chars as bad", () => {
      expect(ungarble.detect("\x84Handwerk")).toBe(true);
    });

    it("detects Ã + accent as bad", () => {
      expect(ungarble.detect("Ã©")).toBe(true);
    });

    it("clean text is not bad", () => {
      expect(ungarble.detect("Hello world")).toBe(false);
    });

    it("counts badness", () => {
      expect(ungarble.score("Ã©")).toBeGreaterThan(0);
    });
  });

  describe("C1 control fix", () => {
    it("fixes C1 controls as Windows-1252", () => {
      expect(ungarble("\x84Handwerk bringt dich \u00fcberall hin\x93"))
        .toBe("\u201eHandwerk bringt dich \u00fcberall hin\u201c");
    });
  });

  describe("control character removal", () => {
    it("removes BOM and control chars", () => {
      expect(ungarble("\ufeffSometimes, \ufffcbad ideas \x7f\ufffalike these characters\ufffb \u206aget standardized.\r\n"))
        .toBe("Sometimes, bad ideas like these characters get standardized.\n");
    });
  });

  describe("surrogate pair fixing", () => {
    it("preserves valid surrogate pairs", () => {
      expect(ungarble("This flag has a dragon on it 🏴\uDB40\uDC67\uDB40\uDC62\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F"))
        .toBe("This flag has a dragon on it 🏴\uDB40\uDC67\uDB40\uDC62\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73\uDB40\uDC7F");
    });
  });

  describe("line break normalization", () => {
    it("normalizes CRLF to LF", () => {
      expect(ungarble("hello\r\nworld")).toBe("hello\nworld");
    });

    it("normalizes CR to LF", () => {
      expect(ungarble("hello\rworld")).toBe("hello\nworld");
    });
  });

  describe("terminal escape removal", () => {
    it("removes ANSI color escapes", () => {
      expect(ungarble("\x01\x1b[36;44mfoo")).toBe("foo");
    });
  });
});
