import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { configDefaults, defineConfig } from "vitest/config";
import { sharedInclude, sharedExclude } from "./scripts/runtime-suite.mjs";
import { installedPackage } from "./scripts/package-plugin.js";

export default defineConfig({
  plugins: [
    installedPackage(),
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-10-14",
        serviceBindings: { PACKAGE_WORKER: "package-worker" },
        workers: [{
          name: "package-worker", modules: true, scriptPath: ".ci/cloudflare-worker.mjs",
          compatibilityDate: "2026-10-14", compatibilityFlags: ["no_nodejs_compat", "no_nodejs_compat_v2"],
        }],
      },
    }),
  ],
  test: {
    include: [...sharedInclude, "test/workers/**/*.test.ts"],
    exclude: [...configDefaults.exclude, ...sharedExclude],
    testTimeout: 60_000,
  },
});
