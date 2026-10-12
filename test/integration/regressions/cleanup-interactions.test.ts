import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("cleanup interactions", () => {
  it.each(["\0", "\ufeff", "\u206a", "\ufff9"])("repairs bytes joined by removing %j", control => {
    const input = `cafÃ${control}©`;
    for (const chunk of [1, 2, 4, 1_000_000]) {
      const options = { chunk };
      expect(ungarble(input, options)).toBe("café");
      expect(ungarble.explain(input, options).text).toBe("café");
      expect(ungarble(input, { chunk, encoding: false })).toBe("cafÃ©");
      expect(ungarble(input, { chunk, controls: false })).toBe(input);
    }
  });

  it.each(["\n", "\r", "\r\n", "\u2028", "\u2029"])("removes OSC payloads containing %j", newline => {
    for (const terminator of ["\x07", "\x1b\\"]) {
      const input = `cafÃ\x1b]0;title${newline}continued${terminator}©\nnext`;
      for (const chunk of [1, 4, 1_000_000]) {
        expect(ungarble(input, { chunk })).toBe("café\nnext");
        expect(ungarble.explain(input, { chunk }).text).toBe("café\nnext");
      }
      expect(ungarble(input, { escapes: false, controls: false, encoding: false, lines: false })).toBe(input);
    }
  });

  it("handles multiple multiline OSC sequences and ordinary lines", () => {
    const input = "first\n\x1b]one\na\x07middle\x1b]two\nb\x1b\\last\nend";
    expect(ungarble(input)).toBe("first\nmiddlelast\nend");
    expect(ungarble(input, { lines: false })).toBe("first\nmiddlelast\nend");
    expect(ungarble.explain(input).steps).toContainEqual({ action: "apply", detail: "terminal_escapes" });
  });

  it("still bounds chunk lookahead for multiline escapes", () => {
    const input = "\x1b]title\n" + "a".repeat(5000) + "\x07";
    expect(() => ungarble(input, { chunk: 1 })).toThrow(RangeError);
  });

  it.each([
    ["before\x1b]title\x1b\\after", "beforeafter"],
    ["\x01\x1b]title\x1b\\\x02after", "after"],
    ["a\x1b]x\ny\x1b\\b", "ab"],
  ])("preserves OSC delimiters at every chunk boundary in %j", (input, expected) => {
    for (let chunk = 1; chunk <= input.length; chunk++) {
      expect(ungarble(input, { chunk })).toBe(expected);
      expect(ungarble(input, { chunk, controls: false })).toBe(expected);
      expect(ungarble.explain(input, { chunk }).text).toBe(expected);
    }
  });
});
