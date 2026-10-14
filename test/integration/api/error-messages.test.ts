import { describe, expect, it } from "vitest";
import { ungarble } from "../../../src/index.js";
import { ungarble as esm } from "../../../dist/index.js";

import { errorCases as cases } from "../../support/error-cases.js";

describe("error message contract", () => {
  for (const [format, api] of [["source", ungarble], ["ESM", esm]] as const) {
    it.each(cases)(`${format}: $name`, ({ input, options, error }) => {
      for (const call of [api, api.explain]) {
        let caught: unknown;
        try { call(input, options); } catch (failure) { caught = failure; }
        expect(caught).toBeInstanceOf(error.constructor);
        expect((caught as Error).message).toBe(error.message);
        expect((caught as Error).message).toMatch(/^[A-Z][^\n]*\.$/);
      }
    });
  }
});
