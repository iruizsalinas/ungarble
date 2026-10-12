import { describe, it, expect } from "vitest";
import { ungarble } from "../../../src/index.js";

describe("do no harm - valid text must pass through unchanged", () => {
  describe("kaomoji / emoticons", () => {
    it("preserves kaomoji with accented chars", () => {
      const text = "OK??:(   `¬´    ):";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves face emoticon", () => {
      const text = "( o¬ô )";
      expect(ungarble.encoding(text)).toBe(text);
    });
  });

  describe("text that superficially resembles mojibake", () => {
    it("preserves text with Ã used correctly", () => {
      const text = "There are a lot of Ã's in mojibake text";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Ã followed by a curly possessive apostrophe", () => {
      const text = "There are a lot of Ã’s in mojibake text";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves accented names followed by a curly possessive apostrophe", () => {
      const text = "Join ZZAJÉ’s Official Fan List and receive news, events, and more!";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves non-ASCII Indonesian leetspeak", () => {
      const text = "MÄ£ÄM ÌÑÌ Q £ÄGÌ GÄLÄW ÑÍCH SÖÄ£ ÑÝÄ $ÚÄMÌ Q £ÄGÌ GÄK ÉÑÄK BÄDÄÑ";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves NICIODATĂ™", () => {
      const text = "NICIODATĂ™";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves TRANSFORMATORIŲ™", () => {
      const text = "TRANSFORMATORIŲ™";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves AHŘ IKEA", () => {
      const text = "AHŘ, the new sofa from IKEA";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Ukrainian ВІКІ", () => {
      const text = "ВІКІ is Ukrainian for WIKI";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves angstrom radius", () => {
      const text = "a radius of 10 Å—";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Offering 5×£35", () => {
      const text = "Offering 5×£35 pin ups";
      expect(ungarble.encoding(text)).toBe(text);
    });

    it("preserves Connect with Āø", () => {
      const text = "Connect with Āø on Facebook";
      expect(ungarble.encoding(text)).toBe(text);
    });
  });
});
