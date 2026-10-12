import { describe, it, expect } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("empty input and Unicode handling", () => {
  it("empty string", () => {
    expect(ungarble("")).toBe("");
  });

  it("single ASCII char", () => {
    expect(ungarble("a")).toBe("a");
  });

  it("pure ASCII sentence", () => {
    expect(ungarble("The quick brown fox jumps over the lazy dog.")).toBe(
      "The quick brown fox jumps over the lazy dog.",
    );
  });

  it("already valid UTF-8 accented text", () => {
    expect(ungarble("caf\u00e9")).toBe("caf\u00e9");
  });

  it("emoji only", () => {
    const text = "\ud83d\ude00\ud83c\udf0d\ud83c\udf89";
    expect(ungarble(text)).toBe(text);
  });

  it("CJK text", () => {
    const text = "\u65e5\u672c\u8a9e\u30c6\u30b9\u30c8\u4e2d\u6587\u6d4b\u8bd5\ud55c\uad6d\uc5b4";
    expect(ungarble(text)).toBe(text);
  });

  it("very long ASCII string", () => {
    const text = "hello world ".repeat(10000);
    expect(ungarble(text)).toBe(text);
  });

  it("string with only newlines", () => {
    expect(ungarble("\n\n\n")).toBe("\n\n\n");
  });

  it("string with only spaces", () => {
    expect(ungarble("   ")).toBe("   ");
  });

  it("null byte in string", () => {
    expect(ungarble("a\x00b")).toBe("ab");
  });

  it("tab and newline preserved", () => {
    expect(ungarble("a\tb\nc")).toBe("a\tb\nc");
  });

  it("CRLF normalized", () => {
    expect(ungarble("a\r\nb")).toBe("a\nb");
  });

  it("multiple fixes in one string", () => {
    // Mojibake + control char + CRLF
    expect(ungarble("caf\u00c3\u00a9\x00\r\n")).toBe("caf\u00e9\n");
  });

  it("BOM removal", () => {
    expect(ungarble("\ufeffhello")).toBe("hello");
  });

  it("flag emoji preserved", () => {
    const flag = "\ud83c\udff4\udb40\udc67\udb40\udc62\udb40\udc77\udb40\udc6c\udb40\udc73\udb40\udc7f";
    expect(ungarble("dragon " + flag)).toBe("dragon " + flag);
  });

  it("supplementary plane characters preserved", () => {
    const text = "\ud835\udcb6 = \ud835\udcb7 + \ud835\udcb8"; // math italic
    expect(ungarble(text)).toBe(text);
  });

  it("mixed valid and mojibake on same line", () => {
    expect(ungarble("good caf\u00c3\u00a9 good")).toBe("good caf\u00e9 good");
  });

  it("idempotent: fixing twice gives same result", () => {
    const input = "Iggy Pop (n\u00c3\u0192\u00c2\u00a9 Jim Osterberg)";
    const once = ungarble(input);
    const twice = ungarble(once);
    expect(twice).toBe(once);
  });

  it("idempotent: valid text through multiple passes", () => {
    const text = "caf\u00e9 r\u00e9sum\u00e9 na\u00efve";
    for (let i = 0; i < 5; i++) {
      expect(ungarble(text)).toBe(text);
    }
  });
});
