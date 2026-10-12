import { describe, expect, it } from "vitest";
import { CHARMAP_ENCODINGS, possibleEncoding } from "../../../src/detection/encodings.js";
import { decodeSingleByte, encodeSingleByte } from "../../../src/codecs/single-byte.js";

describe("single-byte codecs", () => {
  it.each(CHARMAP_ENCODINGS)("round trips every decoded character in %s", encoding => {
    for (let byte = 0; byte < 256; byte++) {
      const decoded = decodeSingleByte(new Uint8Array([byte]), encoding);
      expect(possibleEncoding(decoded, encoding)).toBe(true);
      const encoded = encodeSingleByte(decoded, encoding);
      expect(encoded).not.toBeNull();
      // Some code pages intentionally contain duplicate mappings: first wins.
      expect(decodeSingleByte(encoded!, encoding)).toBe(decoded);
    }
    expect(encodeSingleByte("😀", encoding)).toBeNull();
    expect(encodeSingleByte("\ud800", encoding)).toBeNull();
  });

  it("keeps Latin-1 distinct from Windows-1252", () => {
    expect(decodeSingleByte(new Uint8Array([0x80]), "latin-1")).toBe("\u0080");
    expect(decodeSingleByte(new Uint8Array([0x80]), "windows-1252")).toBe("€");
    expect(encodeSingleByte("€", "latin-1")).toBeNull();
  });
});
