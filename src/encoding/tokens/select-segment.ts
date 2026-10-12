import { type tokenReader } from "./reader.js";

/** Only recurse on a proper substring; a whole-input match must decode directly. */
export function selectRepairSegment(
  text: string, matchStr: string, matchIndex: number, matchIsBad: boolean,
  tokenAround: ReturnType<typeof tokenReader>,
) {
  let segmentStart = matchIndex;
  let segmentEnd = matchIndex + matchStr.length;
  let segmentStr = matchStr;
  let decodeMatchOnly = false;
  if (matchIsBad) {
    const token = tokenAround(matchIndex, segmentEnd);
    if (
      !matchStr.endsWith(" ") &&
      token.damaged &&
      token.text.length > matchStr.length &&
      token.text.length < text.length &&
      token.bad
    ) {
      segmentStart = token.start;
      segmentEnd = token.end;
      segmentStr = token.text;
    }
  } else {
    const token = tokenAround(matchIndex, segmentEnd);
    if (token.text.length <= matchStr.length || !token.bad) return null;
    if (token.text.length >= text.length) {
      // Recursing on the complete input would call this function with the
      // same arguments. Decode only the detector match, using the bad token
      // as the confidence signal.
      decodeMatchOnly = true;
    } else {
      segmentStart = token.start;
      segmentEnd = token.end;
      segmentStr = token.text;
    }
  }
  return { segmentStart, segmentEnd, segmentStr, decodeMatchOnly };
}
