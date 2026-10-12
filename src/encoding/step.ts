import { type FixResult, type ExplanationStep } from "../types.js";
import { isBad } from "../detection/badness.js";
import { type EncodingName } from "../codecs/types.js";
import { CHARMAP_ENCODINGS, possibleEncoding } from "../detection/encodings.js";
import { decodeCandidate, decodeDetectorMatch } from "./candidate.js";
import { startsWithAmbiguousSingleNonLatinMojibake, containsAmbiguousSingleNonLatinMojibakeReplacement } from "./guards/ambiguity.js";
import { hasUnsupportedNonLatinMojibakeRepair } from "./guards/mixed-scripts.js";
import { C1_CONTROL_RE } from "../detection/control-patterns.js";
import { encodeSingleByte, decodeSingleByte } from "../codecs/single-byte.js";
import { fixC1Controls } from "../transforms/c1.js";
import { hasUtf8MojibakeSequence } from "../detection/utf8-pattern.js";
import { decodeInconsistentUtf8 } from "./inconsistent.js";
import { fixBadTokens } from "./tokens/repair.js";
import { CURLY_CONTRACTION_RE } from "./guards/partial.js";

export function isAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}

export function hasCurlyPossessive(text: string): boolean {
  return CURLY_CONTRACTION_RE.test(text);
}

export function fixEncodingOneStep(text: string, repair: (text: string) => string): FixResult {
  if (isAscii(text)) {
    return { text, steps: [] };
  }

  const textIsBad = isBad(text);
  const triedEncodings: EncodingName[] = [];

  if (textIsBad) {
    for (const encoding of CHARMAP_ENCODINGS) {
      if (!possibleEncoding(text, encoding)) continue;

      const candidate = decodeCandidate(text, encoding);
      const decoded = candidate?.text ?? null;

      if (
        decoded !== null &&
        !hasCurlyPossessive(text) &&
        !startsWithAmbiguousSingleNonLatinMojibake(text, decoded) &&
        !containsAmbiguousSingleNonLatinMojibakeReplacement(text, decoded) &&
        !hasUnsupportedNonLatinMojibakeRepair(text, decoded)
      ) {
        const steps: ExplanationStep[] = [
          { action: "encode", detail: encoding },
          { action: "decode", detail: candidate!.variants ? "utf-8-variants" : "utf-8" },
        ];
        return { text: decoded, steps };
      }

      triedEncodings.push(encoding);
    }
  }

  // inconsistent UTF-8: runs even when full text isn't "bad". Like ftfy, try
  // it before the C1 conversions below: they would turn the C1 byte of
  // mojibake such as C3 8E (I with circumflex) into unrelated Windows-1252 punctuation.
  if (hasUtf8MojibakeSequence(text)) {
    const fixed = decodeInconsistentUtf8(text, repair, decodeDetectorMatch);
    if (fixed !== text) {
      return {
        text: fixed,
        steps: [{ action: "apply", detail: "decode_inconsistent_utf8" }],
      };
    }
  }

  if (textIsBad) {
    const fixed = fixBadTokens(text, repair);
    if (fixed !== text) {
      return {
        text: fixed,
        steps: [{ action: "apply", detail: "fix_bad_tokens" }],
      };
    }
    return fixC1ControlsStep(text, triedEncodings);
  }

  return { text, steps: [] };
}

function fixC1ControlsStep(text: string, triedEncodings: EncodingName[]): FixResult {
  C1_CONTROL_RE.lastIndex = 0;
  if (!C1_CONTROL_RE.test(text)) return { text, steps: [] };

  // Latin-1 -> Windows-1252 transcode for C1 controls
  if (
    triedEncodings.includes("latin-1") &&
    !triedEncodings.includes("sloppy-windows-1252") &&
    possibleEncoding(text, "latin-1")
  ) {
    const encoded = encodeSingleByte(text, "latin-1");
    if (encoded) {
      const decoded = decodeSingleByte(encoded, "windows-1252");
      if (decoded !== text) {
        return {
          text: decoded,
          steps: [{ action: "transcode", detail: "latin-1 -> windows-1252" }],
        };
      }
    }
  }

  const fixed = fixC1Controls(text);
  if (fixed !== text) {
    return {
      text: fixed,
      steps: [{ action: "apply", detail: "fix_c1_controls" }],
    };
  }
  return { text, steps: [] };
}
