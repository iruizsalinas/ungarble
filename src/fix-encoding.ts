import { isBad } from "./badness.js";
import { CHARMAP_ENCODINGS, possibleEncoding, UTF8_DETECTOR_RE, C1_CONTROL_RE } from "./chardata.js";
import {
  encodeSingleByte, decodeSingleByte, decodeUtf8, decodeUtf8Variants, bytesContain,
  type EncodingName,
} from "./codecs.js";
import {
  restoreByteA0, replaceLossySequences, decodeInconsistentUtf8, fixBadTokens, fixC1Controls,
} from "./fixes.js";

export interface ExplanationStep {
  action: "encode" | "decode" | "transcode" | "apply";
  detail: string;
}

export interface FixResult {
  text: string;
  steps: ExplanationStep[];
}

function isAscii(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 0x7f) return false;
  }
  return true;
}

function isSloppy(encoding: EncodingName): boolean {
  return encoding.startsWith("sloppy-");
}

function fixEncodingOneStep(text: string): FixResult {
  if (isAscii(text)) {
    return { text, steps: [] };
  }

  const textIsBad = isBad(text);

  if (textIsBad) {
    const triedEncodings: EncodingName[] = [];

    for (const encoding of CHARMAP_ENCODINGS) {
      if (!possibleEncoding(text, encoding)) continue;

      const encoded = encodeSingleByte(text, encoding);
      if (!encoded) continue;

      let bytes = encoded;
      const restored = restoreByteA0(bytes);
      bytes = restored;

      if (isSloppy(encoding)) {
        bytes = replaceLossySequences(bytes);
      }

      const needVariants = bytesContain(bytes, 0xed) || bytesContain(bytes, 0xc0);
      const decoded = needVariants
        ? decodeUtf8Variants(bytes)
        : decodeUtf8(bytes);

      if (decoded !== null) {
        const steps: ExplanationStep[] = [
          { action: "encode", detail: encoding },
          { action: "decode", detail: needVariants ? "utf-8-variants" : "utf-8" },
        ];
        return { text: decoded, steps };
      }

      triedEncodings.push(encoding);
    }

    // Latin-1 -> Windows-1252 transcode for C1 controls
    if (
      triedEncodings.includes("latin-1") &&
      !triedEncodings.includes("sloppy-windows-1252") &&
      possibleEncoding(text, "latin-1")
    ) {
      C1_CONTROL_RE.lastIndex = 0;
      if (C1_CONTROL_RE.test(text)) {
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
    }

    C1_CONTROL_RE.lastIndex = 0;
    if (C1_CONTROL_RE.test(text)) {
      const fixed = fixC1Controls(text);
      if (fixed !== text) {
        return {
          text: fixed,
          steps: [{ action: "apply", detail: "fix_c1_controls" }],
        };
      }
    }
  }

  // inconsistent UTF-8: runs even when full text isn't "bad"
  UTF8_DETECTOR_RE.lastIndex = 0;
  if (UTF8_DETECTOR_RE.test(text)) {
    const fixed = decodeInconsistentUtf8(text, fixEncoding);
    if (fixed !== text) {
      return {
        text: fixed,
        steps: [{ action: "apply", detail: "decode_inconsistent_utf8" }],
      };
    }
  }

  if (textIsBad) {
    const fixed = fixBadTokens(text, fixEncoding);
    if (fixed !== text) {
      return {
        text: fixed,
        steps: [{ action: "apply", detail: "fix_bad_tokens" }],
      };
    }
  }

  return { text, steps: [] };
}

export function fixEncoding(text: string): string {
  let current = text;
  for (let i = 0; i < 20; i++) { // safety limit
    const result = fixEncodingOneStep(current);
    if (result.text === current) break;
    current = result.text;
  }
  return current;
}

export function fixEncodingAndExplain(text: string): FixResult {
  let current = text;
  const allSteps: ExplanationStep[] = [];

  for (let i = 0; i < 20; i++) {
    const result = fixEncodingOneStep(current);
    if (result.text === current) break;
    allSteps.push(...result.steps);
    current = result.text;
  }

  return { text: current, steps: allSteps };
}
