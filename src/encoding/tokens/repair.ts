import { isTokenBoundary, hasWordAfterAdjacentPunctuation } from "./boundaries.js";
import { isBad } from "../../detection/badness.js";
import { isAmbiguousSingleNonLatinMojibakeSource, isAmbiguousSingleNonLatinMojibake, startsWithAmbiguousSingleNonLatinMojibake, containsAmbiguousSingleNonLatinMojibakeReplacement } from "../guards/ambiguity.js";
import { hasUnsupportedNonLatinMojibakeRepair } from "../guards/mixed-scripts.js";

export function fixBadTokens(text: string, fixEncodingFn: (t: string) => string): string {
  let result = "";
  let lastIndex = 0;
  let changed = false;
  const fixedTokens = new Map<string, string>();

  for (let i = 0; i < text.length;) {
    if (isTokenBoundary(text, i)) {
      i++;
      continue;
    }

    const start = i;
    while (i < text.length && !isTokenBoundary(text, i)) {
      i++;
    }

    const token = text.slice(start, i);
    if (token.length >= text.length || !isBad(token)) continue;

    let fixed = fixedTokens.get(token);
    if (fixed === undefined) {
      fixed = fixEncodingFn(token);
      fixedTokens.set(token, fixed);
    }
    if (isAmbiguousSingleNonLatinMojibakeSource(token)) {
      continue;
    }
    if (
      isAmbiguousSingleNonLatinMojibake(token, fixed) &&
      hasWordAfterAdjacentPunctuation(text, i)
    ) {
      continue;
    }
    if (
      startsWithAmbiguousSingleNonLatinMojibake(token, fixed) ||
      containsAmbiguousSingleNonLatinMojibakeReplacement(token, fixed) ||
      hasUnsupportedNonLatinMojibakeRepair(token, fixed)
    ) {
      continue;
    }
    if (fixed !== token) {
      result += text.slice(lastIndex, start) + fixed;
      lastIndex = i;
      changed = true;
    }
  }

  if (!changed) return text;
  return result + text.slice(lastIndex);
}
