import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("Unicode transformation properties", () => {
  it("matches native replacement of malformed UTF-16 over generated inputs", () => {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    let seed = 0x5eed;
    const rand = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
    const special = ["\ud800", "\udbff", "\udc00", "\udfff", "\ufeff", "\0", "😀"];
    for (let sample = 0; sample < 1000; sample++) {
      let input = "";
      for (let i = 0; i < 32; i++) {
        input += i % 2 === 0 ? special[rand() % special.length] : String.fromCharCode(rand() >>> 16);
      }
      expect(ungarble.surrogates(input)).toBe(decoder.decode(encoder.encode(input)));
    }
  });

  it.each(["quotes", "ligatures", "width", "lines", "surrogates", "controls", "c1"] as const)
    ("keeps %s stable after one transformation", method => {
      for (const input of ["", "‘ﬁ’\r\nＡ\0Ｂ", "😀\ud800\udc00\udfff", "\u0080\u0085\ufeff", "e\u0301\u200d"]) {
        const once = ungarble[method](input);
        expect(ungarble[method](once)).toBe(once);
      }
    });

  it("maps every fullwidth ASCII character without changing adjacent emoji", () => {
    for (let code = 0xff01; code <= 0xff5e; code++) {
      expect(ungarble.width("😀" + String.fromCharCode(code)))
        .toBe("😀" + String.fromCharCode(code - 0xfee0));
    }
  });

  it("maps halfwidth and fullwidth forms to standard width", () => {
    expect(ungarble.width("￥１２３ ￡ ￠ ｶﾀｶﾅ ｡｢ﾃｽﾄ｣ ￩￫ ￭")).toBe("¥123 £ ¢ カタカナ 。「テスト」 ←→ ■");
    expect(ungarble("ｶﾞｷﾞ ￥500", { width: true })).toBe("ガギ ¥500");
    expect(ungarble("ｶﾞｷﾞ ￥500")).toBe("ｶﾞｷﾞ ￥500");
  });

  it.each(["👨‍👩‍👧‍👦", "🏳️‍🌈", "👍🏽", "🇫🇷", "1️⃣", "العربية", "עברית", "किताब"])
    ("preserves valid script and emoji sequence %s", input => {
      expect(ungarble(input)).toBe(input);
    });
});
