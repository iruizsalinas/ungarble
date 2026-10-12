import { selectRepairSegment } from "./tokens/select-segment.js";
import { acceptMatchRepair } from "./guards/accept-match.js";
import { findUtf8MojibakeSequences } from "../detection/utf8-pattern.js";
import { tokenReader, hasSpacedInitialsBefore } from "./tokens/reader.js";
import { countUtf8MojibakeSequences, hasLossySignal, hasReplacementSignal, isCurlyPossessiveMatch } from "./guards/partial.js";
import { hasConfidentDecodedScript } from "./guards/scripts.js";
import { isAmbiguousSingleNonLatinMojibakeSource } from "./guards/ambiguity.js";
import { isBad } from "../detection/badness.js";
import { isSingleAmbiguousLatinChar } from "./guards/characters.js";

export function decodeInconsistentUtf8(
  text: string,
  fixEncodingFn: (t: string) => string,
  decodeMatchFn: (t: string) => string = fixEncodingFn,
): string {
  let result = "";
  let lastIndex = 0;
  // Every detector match inside one token selects the same token segment and
  // gets the same verdict. Remember the last segment evaluated so later matches
  // skip it, instead of revalidating the whole token once per match.
  let seenStart = -1;
  let seenEnd = -1;
  const fixedSegments = new Map<string, string>();
  const fixedMatches = new Map<string, string>();
  const tokenAround = tokenReader(text);

  for (const match of findUtf8MojibakeSequences(text)) {
    const matchStr = match[0];
    const matchIndex = match.index;
    if (matchIndex < lastIndex) continue;

    // A complete detector match containing multiple UTF-8 sequences is strong
    // evidence even when the badness table does not cover the target script.
    // Decode it directly instead of recursively calling fixEncoding unchanged.
    if (matchStr.length >= text.length) {
      const lossySignal = hasReplacementSignal(matchStr);
      // A space may stand in for a lost NBSP byte, but that alone is weak
      // evidence: a Cyrillic or accented Latin letter, a space and punctuation
      // also restore to a CJK character.
      const spaceSignal = matchStr.length >= 3 && matchStr.includes(" ");
      if (
        !/^[\p{Script=Cyrillic}]+$/u.test(matchStr) &&
        (
          countUtf8MojibakeSequences(matchStr) >= 2 ||
          lossySignal ||
          spaceSignal
        )
      ) {
        const fixed = decodeMatchFn(matchStr);
        const confident = hasConfidentDecodedScript(fixed);
        if (fixed !== matchStr && (lossySignal || (spaceSignal ? !confident : confident))) return fixed;
      }
      continue;
    }
    if (isAmbiguousSingleNonLatinMojibakeSource(matchStr)) continue;
    if (isCurlyPossessiveMatch(text, matchIndex, matchStr)) continue;

    const matchIsBad = isBad(matchStr);
    // A space between a word and punctuation is ordinary prose unless a
    // replacement character shows that bytes were lost.
    const lossySignal = hasLossySignal(text, matchIndex, matchStr);
    const embeddedInAsciiWord =
      matchStr[0] === "\u00c3" &&
      /[A-Za-z]/u.test(text[matchIndex - 1] ?? "") &&
      /[A-Za-z]/u.test(text[matchIndex + matchStr.length] ?? "");
    if (!matchIsBad && embeddedInAsciiWord) {
      const directlyFixed = decodeMatchFn(matchStr);
      if (isSingleAmbiguousLatinChar(directlyFixed)) {
        result += text.slice(lastIndex, matchIndex) + directlyFixed;
        lastIndex = matchIndex + matchStr.length;
        continue;
      }
    }
    if (
      !matchIsBad &&
      !/^[\p{Script=Cyrillic}]+$/u.test(matchStr) &&
      (
        countUtf8MojibakeSequences(matchStr) >= 2 ||
        lossySignal
      )
    ) {
      const directlyFixed = decodeMatchFn(matchStr);
      if (
        directlyFixed !== matchStr &&
        (lossySignal || hasConfidentDecodedScript(directlyFixed))
      ) {
        result += text.slice(lastIndex, matchIndex) + directlyFixed;
        lastIndex = matchIndex + matchStr.length;
        continue;
      }
    }

    const segment = selectRepairSegment(text, matchStr, matchIndex, matchIsBad, tokenAround);
    if (!segment) continue;
    const { segmentStart, segmentEnd, segmentStr, decodeMatchOnly } = segment;
    if (segmentStr.length >= text.length) continue;
    if (segmentStart < lastIndex) continue;
    if (segmentStart === seenStart && segmentEnd === seenEnd) continue;
    seenStart = segmentStart;
    seenEnd = segmentEnd;

    // Skip spaced-out initials such as "C O N C L U S [C3] O" without
    // suppressing ordinary prose that happens to precede an altered NBSP.
    if (segmentStr.endsWith(" ") && segmentStart >= 2) {
      if (hasSpacedInitialsBefore(text, segmentStart)) continue;
    }

    // Reuse the cached token string itself. Prefixing it would allocate and
    // hash a new token-sized key for every unchanged match in the token.
    const cache = decodeMatchOnly ? fixedMatches : fixedSegments;
    let fixed = cache.get(segmentStr);
    if (fixed === undefined) {
      fixed = decodeMatchOnly ? decodeMatchFn(segmentStr) : fixEncodingFn(segmentStr);
      cache.set(segmentStr, fixed);
    }
    if (!acceptMatchRepair(text, matchStr, matchIndex, segmentStr, fixed, tokenAround)) continue;
    if (fixed !== segmentStr) {
      result += text.slice(lastIndex, segmentStart);
      // preserve word-boundary space consumed by fix, except Portuguese contractions
      if (segmentStr.endsWith(" ") && !fixed.endsWith(" ") && fixed.length < segmentStr.length) {
        const rest = text.slice(segmentEnd);
        const isPortugueseContraction = fixed === "\u00e0" && /^(?:s[\s,;.!?)]|s$|quele|quela|quilo)/i.test(rest);
        if (isPortugueseContraction) {
          result += fixed;
        } else if (rest.length > 0 && !rest.startsWith(" ")) {
          result += fixed + " ";
        } else {
          result += fixed;
        }
      } else {
        result += fixed;
      }
      lastIndex = segmentEnd;
    }
  }

  if (lastIndex === 0) return text;
  result += text.slice(lastIndex);
  return result;
}
