import { MAX_NORMALIZATION_MARKS } from "./budgets.js";
import { ERROR_MESSAGES } from "./error-messages.js";

const MARK_RE = /\p{M}/u;

/** Bound canonical reordering work before entering the native normalizer. */
export function normalizeSafely(text: string, form: string): string {
  if (form !== "NFC" && form !== "NFD" && form !== "NFKC" && form !== "NFKD") return text;
  const decomposition = form === "NFKC" || form === "NFKD" ? "NFKD" : "NFD";
  const cache = new Map<string, string>();
  let marks = 0;
  for (const char of text) {
    if (char.charCodeAt(0) < 0x80) {
      marks = 0;
      continue;
    }
    let decomposed = cache.get(char);
    if (decomposed === undefined) {
      // A single code point has bounded decomposition, even for NFKD.
      decomposed = char.normalize(decomposition);
      if (cache.size < 1024) cache.set(char, decomposed);
    }
    for (const part of decomposed) {
      marks = MARK_RE.test(part) ? marks + 1 : 0;
      if (marks > MAX_NORMALIZATION_MARKS) {
        throw new RangeError(ERROR_MESSAGES.normalization);
      }
    }
  }
  return text.normalize(form);
}
