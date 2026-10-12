import { afterEach, describe, expect, it, vi } from "vitest";
import * as step from "../../../src/encoding/step.js";
import { fixEncoding, fixEncodingAndExplain } from "../../../src/encoding/repair.js";
import { MAX_REPAIR_DEPTH, MAX_REPAIR_PASSES } from "../../../src/security/budgets.js";

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
