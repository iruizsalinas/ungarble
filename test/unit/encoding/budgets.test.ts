import { afterEach, describe, expect, it, vi } from "vitest";
import * as step from "../../../src/encoding/step.js";
import { fixEncoding, fixEncodingAndExplain } from "../../../src/encoding/repair.js";
import { applyFixPipeline } from "../../../src/pipeline/passes.js";
import { DEFAULT_CONFIG } from "../../../src/config.js";
import { MAX_REPAIR_DEPTH, MAX_REPAIR_PASSES, MAX_REPAIR_WORK_FACTOR } from "../../../src/security/budgets.js";

afterEach(() => vi.restoreAllMocks());

describe("repair orchestration safeguards", () => {
  it("stops a nonconverging future repair rule after its pass budget", () => {
    const repair = vi.spyOn(step, "fixEncodingOneStep").mockImplementation(text => ({
      text: text + "x", steps: [{ action: "apply", detail: "test-rule" }],
    }));
    const result = fixEncodingAndExplain("");
    expect(result.text).toBe("x".repeat(MAX_REPAIR_PASSES));
    expect(result.steps).toHaveLength(MAX_REPAIR_PASSES);
    expect(repair).toHaveBeenCalledTimes(MAX_REPAIR_PASSES);
  });

  it("stops later passes once the work budget for the input is spent", () => {
    const repair = vi.spyOn(step, "fixEncodingOneStep").mockImplementation(text => ({
      text: text + "x", steps: [],
    }));
    // Each pass scans the whole text. The first always runs; later passes
    // stop after the work reaches the budget's multiple of the input length.
    expect(fixEncoding("a".repeat(100_000)).length).toBe(100_000 + MAX_REPAIR_WORK_FACTOR + 1);
    expect(repair).toHaveBeenCalledTimes(MAX_REPAIR_WORK_FACTOR + 1);
  });

  it("shares one budget across nested pipeline and encoding passes", () => {
    // Removing the control character reveals mojibake for a second pass, and
    // decoding the numeric reference completes another entity.
    const config = { ...DEFAULT_CONFIG, html: true };
    for (const [input, onePass, full] of [["caf\u00c3\u0001\u00a9", "caf\u00c3\u00a9", "caf\u00e9"], ["&l&#116;;", "&lt;", "<"]]) {
      expect(applyFixPipeline(input!, config)).toBe(full);
      expect(applyFixPipeline(input!, config, undefined, { remaining: 0 })).toBe(onePass);
    }
  });

  it.each([fixEncoding, fixEncodingAndExplain])("bounds accidental recursive rules", repair => {
    const rule = vi.spyOn(step, "fixEncodingOneStep").mockImplementation((text, recurse) => ({
      text: recurse(text), steps: [],
    }));
    expect(() => repair("same input")).toThrow(new RangeError(
      "Encoding repair exceeds the recursion limit of 32 nested calls.",
    ));
    expect(rule).toHaveBeenCalledTimes(MAX_REPAIR_DEPTH + 1);
  });
});
