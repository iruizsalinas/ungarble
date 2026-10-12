import { describe, it, expect } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("ungarble", () => {
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
