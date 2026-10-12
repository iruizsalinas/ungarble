import { LIGATURES, WIDTH_MAP } from "./data/characters.js";

export const SINGLE_QUOTE_RE = /[\u2018\u2019\u201a\u201b]/g;

export const DOUBLE_QUOTE_RE = /[\u201c\u201d\u201e\u201f]/g;

export function uncurlQuotes(text: string): string {
  return text
    .replace(SINGLE_QUOTE_RE, "'")
    .replace(DOUBLE_QUOTE_RE, '"');
}

// Both maps hold only BMP code points, so a class without the u flag matches
// them exactly and never splits a surrogate pair.
function charClassRegExp(map: Map<number, string>): RegExp {
  const units = [...map.keys()].map((cp) => "\\u" + cp.toString(16).padStart(4, "0"));
  return new RegExp(`[${units.join("")}]`, "g");
}

const LIGATURE_RE = charClassRegExp(LIGATURES);

const WIDTH_RE = charClassRegExp(WIDTH_MAP);

// Replace matches in place instead of collecting one string per character.
export function fixLatinLigatures(text: string): string {
  return text.replace(LIGATURE_RE, (char) => LIGATURES.get(char.charCodeAt(0)) ?? char);
}

export function fixCharacterWidth(text: string): string {
  return text.replace(WIDTH_RE, (char) => WIDTH_MAP.get(char.charCodeAt(0)) ?? char);
}
