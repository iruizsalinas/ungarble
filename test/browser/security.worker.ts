import { ungarble } from "../../dist/index.js";
import { runSecurityPayloads } from "../support/security-payloads.js";

try {
  runSecurityPayloads(ungarble, {
    equal(actual, expected) {
      if (!Object.is(actual, expected)) throw new Error("Security payload assertion failed");
    },
  });
  self.postMessage({ ok: true });
} catch (error) {
  self.postMessage({ ok: false, error: String(error) });
}
