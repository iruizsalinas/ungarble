import { describe, expect, it } from "vitest";
import { decodeUtf8, encodeUtf8, isValidUtf8 } from "../../../src/codecs/utf8.js";
import { decodeUtf8Variants } from "../../../src/codecs/utf8-variants.js";

describe("UTF-8 boundaries", () => {
  it.each(["", "\0", "\u007f", "\u0080", "\u07ff", "\u0800", "\ud7ff", "\ue000", "\uffff", "\u{10000}", "\u{10ffff}", "\ufefftext"])
    ("round trips %j without dropping a BOM", text => {
      expect(decodeUtf8(encodeUtf8(text))).toBe(text);
      expect(decodeUtf8Variants(encodeUtf8(text))).toBe(text);
    });

  it.each([
    [0x80], [0xc2], [0xe0, 0xa0], [0xf0, 0x90, 0x80], [0xff],
    [0xc0, 0xaf], [0xc1, 0xbf], [0xe0, 0x80, 0xaf], [0xf0, 0x80, 0x80, 0xaf],
    [0xed, 0xa0, 0x80], [0xed, 0xb0, 0x80], [0xf4, 0x90, 0x80, 0x80],
    [0xf5, 0x80, 0x80, 0x80], [0xc2, 0x41], [0xe2, 0x28, 0xa1],
  ])("rejects malformed bytes %j", (...bytes) => {
    expect(decodeUtf8(Uint8Array.from(bytes))).toBeNull();
    expect(decodeUtf8Variants(Uint8Array.from(bytes))).toBeNull();
  });

  it("validates exactly like a fatal TextDecoder", () => {
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const check = (bytes: number[]) => {
      let valid = true;
      try { decoder.decode(Uint8Array.from(bytes)); } catch { valid = false; }
      expect(isValidUtf8(Uint8Array.from(bytes)), JSON.stringify(bytes)).toBe(valid);
    };
    for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) check([a, b]);
    const edges = [0x7f, 0x80, 0x8f, 0x90, 0x9f, 0xa0, 0xbf, 0xc0];
    for (let lead = 0xe0; lead <= 0xf5; lead++) {
      for (const b of edges) for (const c of edges) {
        check([lead, b, c]);
        for (const d of edges) check([lead, b, c, d]);
      }
    }
  });

  it("only permits the explicit modified UTF-8 and CESU-8 exceptions", () => {
    expect(decodeUtf8(new Uint8Array([0xc0, 0x80]))).toBeNull();
    expect(decodeUtf8Variants(new Uint8Array([0xc0, 0x80]))).toBe("\0");
    expect(decodeUtf8Variants(new Uint8Array([0xed, 0xa0, 0xbd, 0xed, 0xb8, 0x80]))).toBe("😀");
    expect(decodeUtf8Variants(new Uint8Array([0xed, 0xb8, 0x80, 0xed, 0xa0, 0xbd]))).toBeNull();
  });
});
