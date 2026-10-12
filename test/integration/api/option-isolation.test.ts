import { describe, expect, it } from "vitest";
import { ungarble, type UngarbleConfig } from "../../../src/index.js";

const disabled: UngarbleConfig = {
  encoding: false, html: false, lines: false, controls: false, escapes: false,
  surrogates: false, c1: false, quotes: false, ligatures: false, width: false, normalization: false,
};
const cases: Array<[keyof UngarbleConfig, string, string]> = [
  ["encoding", "cafÃ©", "café"], ["html", "&amp;", "&"],
  ["lines", "a\r\nb\u2028c", "a\nb\nc"], ["controls", "a\0b\ufeff", "ab"],
  ["escapes", "\x1b[31mred\x1b[0m", "red"], ["surrogates", "\ud800x\udc00", "\ufffdx\ufffd"],
  ["c1", "\u0080\u0085", "€…"], ["quotes", "‘hi’ “there”", "'hi' \"there\""],
  ["ligatures", "\ufb03", "ffi"], ["width", "ＡＢ　Ｃ", "AB C"],
];

describe("option isolation", () => {
  it.each(cases)("only applies the enabled %s fixer", (option, input, expected) => {
    expect(ungarble(input, disabled)).toBe(input);
    const options = { ...disabled, [option]: true };
    expect(ungarble(input, options)).toBe(expected);
    expect(ungarble.explain(input, options).text).toBe(expected);
    expect(ungarble(input, disabled)).toBe(input);
  });

  it.each(["NFC", "NFD", "NFKC", "NFKD"] as const)("isolates %s normalization", normalization => {
    const input = "\ufb03 e\u0301";
    expect(ungarble(input, { ...disabled, normalization })).toBe(input.normalize(normalization));
  });

  it("does not remove supplementary Unicode when every fixer is disabled", () => {
    const input = "\ud800\n😀\0\r\n&amp;\ufeff";
    expect(ungarble(input, { ...disabled, chunk: 1 })).toBe(input);
    expect(ungarble.explain(input, disabled)).toEqual({ text: input, steps: [] });
  });

  it.each([0, 0.9, 1, 1.9, 2, Infinity])("enforces limit %s on UTF-16 input", limit => {
    if (limit < 2) expect(() => ungarble("😀", { limit })).toThrow(RangeError);
    else expect(ungarble("😀", { limit })).toBe("😀");
    expect(ungarble("", { limit })).toBe("");
  });

  it("does not share HTML-auto state between calls", () => {
    const options = Object.freeze({ html: "auto" as const });
    expect(ungarble("<tag>&amp;", options)).toBe("<tag>&amp;");
    expect(ungarble("&amp;", options)).toBe("&");
    expect(ungarble("<tag>&amp;", options)).toBe("<tag>&amp;");
  });
});
