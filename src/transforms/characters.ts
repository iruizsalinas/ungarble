import { LIGATURES, WIDTH_MAP } from "./data/characters.js";

export const SINGLE_QUOTE_RE = /[\u2018\u2019\u201a\u201b]/g;

export const DOUBLE_QUOTE_RE = /[\u201c\u201d\u201e\u201f]/g;

export function uncurlQuotes(text: string): string {
  return text
    .replace(SINGLE_QUOTE_RE, "'")
    .replace(DOUBLE_QUOTE_RE, '"');
}

export function fixLatinLigatures(text: string): string {
  const result: string[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    const replacement = LIGATURES.get(cp);
    if (replacement !== undefined) {
      result.push(replacement);
    } else {
      result.push(char);
    }
  }
  return result.join("");
}

export function fixCharacterWidth(text: string): string {
  const result: string[] = [];
  for (const char of text) {
    const cp = char.codePointAt(0)!;
    const replacement = WIDTH_MAP.get(cp);
    if (replacement !== undefined) {
      result.push(replacement);
    } else {
      result.push(char);
    }
  }
  return result.join("");
}
