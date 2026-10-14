import { ungarble } from "ungarble";
import { runSecurityPayloads } from "../test/support/security-payloads.js";

runSecurityPayloads(ungarble, {
  equal(actual, expected) {
    if (!Object.is(actual, expected)) throw new Error(`Security assertion failed: ${String(actual).slice(0, 100)}`);
  },
});
console.log("Security payloads passed");
