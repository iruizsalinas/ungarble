import { describe, expect, it } from "vitest";
import { restoreByteA0 } from "../../../src/encoding/bytes/restore-spaces.js";
import { replaceLossySequences } from "../../../src/encoding/bytes/lossy.js";

describe("lost-byte recovery", () => {
  for (const sequence of [[0xc2, 0xa9], [0xe2, 0x82, 0xac], [0xf0, 0x9f, 0x98, 0x80]]) {
    for (let position = 1; position < sequence.length; position++) {
      for (const replacement of [0x1a, 0x3f]) {
        it(`replaces a damaged ${sequence.length}-byte sequence at byte ${position} (${replacement})`, () => {
          const bytes = Uint8Array.from([0x41, ...sequence, 0x42]);
          bytes[position + 1] = replacement;
          const original = bytes.slice();
          expect([...replaceLossySequences(bytes)]).toEqual([0x41, 0xef, 0xbf, 0xbd, 0x42]);
          expect(bytes).toEqual(original);
        });
      }
    }
  }

  it.each([
    [[0xc2, 0x20], [0xc2, 0xa0]],
    [[0xe2, 0x20, 0xac], [0xe2, 0xa0, 0xac]],
    [[0xe0, 0xb8, 0x20], [0xe0, 0xb8, 0xa0]],
    [[0xe2, 0x9a, 0x20], [0xe2, 0x9a, 0xa0]],
    [[0xf0, 0x20, 0x98, 0x80], [0xf0, 0xa0, 0x98, 0x80]],
    [[0x20, 0xc2, 0x20], [0x20, 0xc2, 0x20]],
    [[0xe1, 0x82, 0x20], [0xe1, 0x82, 0x20]],
    [[0xc2], [0xc2]], [[0xe2, 0x20], [0xe2, 0x20]], [[0xf0, 0x20, 0x98], [0xf0, 0x20, 0x98]],
  ])("restores only recognized missing NBSP bytes: %j", (input, expected) => {
    const bytes = Uint8Array.from(input);
    expect([...restoreByteA0(bytes)]).toEqual(expected);
    expect([...bytes]).toEqual(input);
  });

  it("preserves ordinary question marks, ASCII and complete UTF-8", () => {
    for (const input of [[], [0x3f], [0x41, 0x3f, 0x42], [0xc2, 0xa9], [0xe2, 0x82, 0xac]]) {
      expect([...replaceLossySequences(Uint8Array.from(input))]).toEqual(input);
    }
  });

  it("keeps Portuguese contractions attached and French phrases separated", () => {
    const bytes = (text: string) => Uint8Array.from(text, char => char.charCodeAt(0));
    expect([...restoreByteA0(bytes("\xc3 s "))]).toEqual([...bytes("\xc3\xa0s ")]);
    expect([...restoreByteA0(bytes("\xc3 la "))]).toEqual([...bytes("\xc3\xa0 la ")]);
  });
});
