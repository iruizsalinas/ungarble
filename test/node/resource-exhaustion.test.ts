import { Worker } from "node:worker_threads";
import { describe, it } from "vitest";

describe("isolated Node security workers", () => {
  for (const format of ["esm", "cjs"]) {
    it(`bounds CPU and memory for attack payloads and seeded fuzz (${format})`, async () => {
      // A test timeout alone cannot interrupt a blocked synchronous regex.
      const worker = new Worker(new URL("../fixtures/security-worker.mjs", import.meta.url), {
        workerData: format,
        resourceLimits: { maxOldGenerationSizeMb: 192, stackSizeMb: 4 },
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        await new Promise<void>((resolve, reject) => {
          timer = setTimeout(() => reject(new Error("Security worker exceeded its 5 second budget")), 5000);
          worker.once("message", result => result.ok ? resolve() : reject(new Error(result.error)));
          worker.once("error", reject);
          worker.once("exit", code => reject(new Error(`Security worker exited before completion: ${code}`)));
        });
      } finally {
        clearTimeout(timer);
        await worker.terminate();
      }
    }, 10000);
  }

});
