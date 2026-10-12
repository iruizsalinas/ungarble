import { HTML_ENTITY_RE, HTML_ENTITIES } from "./data/entities.js";
import { decodeSingleByte } from "../codecs/single-byte.js";

export function unescapeHtml(text: string): string {
  return text.replace(HTML_ENTITY_RE, (match) => {
    if (match.startsWith("&#")) {
      const numStr = match.slice(2, -1);
      let cp: number;
      if (numStr.startsWith("x") || numStr.startsWith("X")) {
        const hexPart = numStr.slice(1);
        if (!/^[0-9A-Fa-f]+$/.test(hexPart)) return match;
        cp = parseInt(hexPart, 16);
      } else {
        if (!/^[0-9]+$/.test(numStr)) return match;
        cp = parseInt(numStr, 10);
      }
      if (isNaN(cp)) return match;
      if (cp > 0x10ffff) return "\ufffd";
      // Handle Windows-1252 "HTML5 numeric entity" range (0x80-0x9F)
      // These get mapped to the Windows-1252 character, not the C1 control
      if (cp >= 0x80 && cp <= 0x9f) {
        const bytes = new Uint8Array([cp]);
        return decodeSingleByte(bytes, "windows-1252");
      }
      if (cp === 0) return "";
      try {
        return String.fromCodePoint(cp);
      } catch {
        return "\ufffd";
      }
    }

    const resolved = HTML_ENTITIES.get(match);
    if (resolved !== undefined) return resolved;

    return match;
  });
}
