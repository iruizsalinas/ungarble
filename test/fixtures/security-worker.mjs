import assert from "node:assert/strict";
import { parentPort, workerData } from "node:worker_threads";
import { createRequire } from "node:module";
import { ungarble as esm } from "../../dist/index.js";
import { runSecurityPayloads } from "../../.ci/security-payloads.mjs";

const ungarble = workerData === "cjs" ? createRequire(import.meta.url)("../../dist/index.cjs").ungarble : esm;
try {
  runSecurityPayloads(ungarble, assert);
  parentPort.postMessage({ ok: true });
} catch (error) {
  parentPort.postMessage({ ok: false, error: error.stack });
}
