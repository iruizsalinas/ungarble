import { ungarble } from "ungarble";
import { runSecurityPayloads } from "../test/support/security-payloads.js";

// This auxiliary Worker has Node compatibility explicitly disabled. The Vitest
// runner itself needs compatibility APIs, so test the consumer separately too.
export default {
  fetch() {
    runSecurityPayloads(ungarble, {
      equal(actual, expected) {
        if (!Object.is(actual, expected)) throw new Error("Security payload assertion failed");
      },
    });
    return Response.json({ text: ungarble("cafÃ©"), nodeGlobals: typeof Buffer });
  },
};
