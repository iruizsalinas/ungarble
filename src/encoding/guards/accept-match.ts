import { type tokenReader } from "../tokens/reader.js";
import { isMojibakeMatchBoundary } from "../tokens/boundaries.js";
import { isAmbiguousPartialLatinRepair } from "./partial.js";
import { isAmbiguousSingleNonLatinMojibake, startsWithAmbiguousSingleNonLatinMojibake,
  containsAmbiguousSingleNonLatinMojibakeReplacement } from "./ambiguity.js";
import { hasUnsupportedNonLatinMojibakeRepair } from "./mixed-scripts.js";

export function acceptMatchRepair(
  text: string, matchStr: string, matchIndex: number, segmentStr: string, fixed: string,
  tokenAround: ReturnType<typeof tokenReader>,
): boolean {
  if (
    segmentStr === matchStr &&
    isAmbiguousSingleNonLatinMojibake(segmentStr, fixed)
  ) {
    const token = tokenAround(matchIndex, matchIndex + matchStr.length);
    if (
      token.text.length > matchStr.length &&
      (
        !isMojibakeMatchBoundary(text, matchIndex - 1) ||
        !isMojibakeMatchBoundary(text, matchIndex + matchStr.length) ||
        /[\p{L}\p{N}]/u.test(text.slice(matchIndex + matchStr.length, token.end))
      )
    ) {
      return false;
    }
  }
  if (
    segmentStr === matchStr &&
    isAmbiguousPartialLatinRepair(text, matchIndex, matchStr, fixed)
  ) {
    return false;
  }
  if (
    startsWithAmbiguousSingleNonLatinMojibake(segmentStr, fixed) ||
    containsAmbiguousSingleNonLatinMojibakeReplacement(segmentStr, fixed) ||
    hasUnsupportedNonLatinMojibakeRepair(segmentStr, fixed)
  ) {
    return false;
  }
  return true;
}
