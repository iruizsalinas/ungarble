import { CONTROL_CHAR_RE } from "../detection/control-patterns.js";

export function fixLineBreaks(text: string): string {
  // NEL (U+0085) is NOT converted here -- it's a C1 control character handled
  // by fixC1Controls (mapped to U+2026 HORIZONTAL ELLIPSIS via Windows-1252).
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/\u2029/g, "\n");
}

export function fixSurrogates(text: string): string {
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        result.push(text[i]! + text[i + 1]!);
        i++;
      } else {
        result.push("\ufffd");
      }
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      result.push("\ufffd");
    } else {
      result.push(text[i]!);
    }
  }
  return result.join("");
}

export function removeControlChars(text: string): string {
  return text.replace(CONTROL_CHAR_RE, "");
}
