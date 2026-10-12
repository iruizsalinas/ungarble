import { HTML_ENTITY_RE, HTML_ENTITIES } from "./data/entities.js";
import { decodeSingleByte } from "../codecs/single-byte.js";

// A private cursor: other modules use the shared pattern's lastIndex too.
const ENTITY_RE = new RegExp(HTML_ENTITY_RE.source, "g");
const LEADING_ENTITY_RE = new RegExp(`^(?:${HTML_ENTITY_RE.source})`);
// The longest entity the pattern accepts is 27 units, including its "&".
const ENTITY_TAIL_LENGTH = 26;

export function unescapeHtml(text: string): string {
  let result = "";
  let last = 0;
  ENTITY_RE.lastIndex = 0;
  for (let match = ENTITY_RE.exec(text); match !== null; match = ENTITY_RE.exec(text)) {
    let value = decodeEntity(match[0]);
    if (value === null) continue;
    let end = match.index + match[0].length;
    // Escaped-again HTML such as &amp;lt; decodes to "&" plus the rest of
    // another entity. Finish that chain here, reading only the next entity's
    // text: rescanning the whole text for each level would cost a pipeline pass.
    while (value === "&") {
      const next = LEADING_ENTITY_RE.exec("&" + text.slice(end, end + ENTITY_TAIL_LENGTH));
      if (next === null) break;
      const decoded = decodeEntity(next[0]);
      if (decoded === null) break;
      end += next[0].length - 1;
      value = decoded;
    }
    result += text.slice(last, match.index) + value;
    last = end;
    ENTITY_RE.lastIndex = end;
  }
  return last === 0 ? text : result + text.slice(last);
}

/** The decoded value of one entity, or null to keep it as written. */
function decodeEntity(entity: string): string | null {
  if (entity.startsWith("&#")) {
    const numStr = entity.slice(2, -1);
    let cp: number;
    if (numStr.startsWith("x") || numStr.startsWith("X")) {
      const hexPart = numStr.slice(1);
      if (!/^[0-9A-Fa-f]+$/.test(hexPart)) return null;
      cp = parseInt(hexPart, 16);
    } else {
      if (!/^[0-9]+$/.test(numStr)) return null;
      cp = parseInt(numStr, 10);
    }
    if (isNaN(cp)) return null;
    // Like HTML5, a surrogate reference is an error: emitting it would leave
    // a lone surrogate, or join two references into one astral character.
    if (cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return "\ufffd";
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

  return HTML_ENTITIES.get(entity) ?? null;
}
