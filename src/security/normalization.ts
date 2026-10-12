import { MAX_NORMALIZATION_MARKS } from "./budgets.js";

const MARK_RE = /\p{M}/u;

/**
 * Find combining sequences with more consecutive decomposed marks than the
 * limit. The native normalizer reorders such a run in quadratic time.
 */
function findLongMarkRuns(text: string, decomposition: "NFD" | "NFKD"): Array<[number, number]> {
  const runs: Array<[number, number]> = [];
  const cache = new Map<string, string>();
  let marks = 0;
  let base = 0;
  let runStart = -1;
  let index = 0;
  for (const char of text) {
    const start = index;
    index += char.length;
    if (char.charCodeAt(0) < 0x80) {
      if (runStart !== -1) runs.push([runStart, start]);
      runStart = -1;
      marks = 0;
      base = start;
      continue;
    }
    let decomposed = cache.get(char);
    if (decomposed === undefined) {
      // A single code point has bounded decomposition, even for NFKD.
      decomposed = char.normalize(decomposition);
      if (cache.size < 1024) cache.set(char, decomposed);
    }
    for (const part of decomposed) {
      if (MARK_RE.test(part)) {
        marks++;
        if (marks > MAX_NORMALIZATION_MARKS && runStart === -1) runStart = base;
        continue;
      }
      if (runStart !== -1) runs.push([runStart, start]);
      runStart = -1;
      marks = 0;
      base = start;
    }
  }
  if (runStart !== -1) runs.push([runStart, text.length]);
  return runs;
}

/** Bound canonical reordering work before entering the native normalizer. */
export function normalizeSafely(text: string, form: string): string {
  if (form !== "NFC" && form !== "NFD" && form !== "NFKC" && form !== "NFKD") return text;
  const runs = findLongMarkRuns(text, form === "NFKC" || form === "NFKD" ? "NFKD" : "NFD");
  if (runs.length === 0) return text.normalize(form);
  // Keep each overlong combining sequence, base character included, exactly
  // as it is: the result stays canonically equivalent, and normalizing it
  // again changes nothing. Normalize the text between those sequences.
  let result = "";
  let cursor = 0;
  for (const [start, end] of runs) {
    result += text.slice(cursor, start).normalize(form) + text.slice(start, end);
    cursor = end;
  }
  return result + text.slice(cursor).normalize(form);
}
