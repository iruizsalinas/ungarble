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

// A high surrogate not followed by a low one, or a low surrogate not preceded
// by a high one. Without the u flag, the classes match single code units.
export const LONE_SURROGATE_RE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;

export function fixSurrogates(text: string): string {
  // A regex replacement allocates only the result, not one string per unit.
  return text.replace(LONE_SURROGATE_RE, "\ufffd");
}

export function removeControlChars(text: string): string {
  return text.replace(CONTROL_CHAR_RE, "");
}
