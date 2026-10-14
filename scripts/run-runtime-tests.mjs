import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const runtime = process.argv[2];
const modes = {
  // Importing node:test executes and reports tests even on Node 18.0, before
  // the --test CLI flag was introduced. Each format gets a separate process.
  node: [[".ci/consumer/node-esm.test.mjs"], [".ci/consumer/node-cjs.test.mjs"], [".ci/consumer/security.mjs"]],
  bun: [["test", "./.ci/consumer/bun-esm.test.mjs"], [".ci/consumer/security.mjs"]],
  deno: [["test", "--no-prompt", "--allow-env=FORCE_TTY,NO_COLOR,FORCE_COLOR,CI,TERM", ".ci/consumer/deno-esm.test.mjs"], ["run", "--no-prompt", ".ci/consumer/security.mjs"]],
};
if (!Object.hasOwn(modes, runtime)) throw new Error("Expected node, bun or deno");
for (const args of modes[runtime]) {
  await new Promise((resolve, reject) => {
    const child = spawn(runtime === "node" ? process.execPath : runtime, args, {
      cwd: fileURLToPath(new URL("../", import.meta.url)), stdio: "inherit",
    });
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`${runtime} exceeded the 120 second process budget`));
    }, 120_000);
    child.on("error", error => { clearTimeout(timer); reject(error); });
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      code === 0 ? resolve() : reject(new Error(`${runtime} failed (${signal ?? code})`));
    });
  });
}
