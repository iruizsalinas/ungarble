import { configDefaults, defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { sharedInclude, sharedExclude } from "./scripts/runtime-suite.mjs";
import { installedPackage } from "./scripts/package-plugin.js";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          include: ["test/**/*.test.ts"],
          exclude: [...configDefaults.exclude, "test/browser/**", "test/workers/**"],
        },
      },
      {
        plugins: [installedPackage()],
        worker: { plugins: () => [installedPackage()] },
        test: {
          name: "browser",
          fileParallelism: false,
          include: [...sharedInclude, "test/browser/**/*.test.ts"],
          exclude: [...configDefaults.exclude, ...sharedExclude],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: (process.env.TEST_BROWSER ? [process.env.TEST_BROWSER] : ["chromium", "firefox", "webkit"])
              .map(browser => {
                if (browser !== "chromium" && browser !== "firefox" && browser !== "webkit") {
                  throw new Error(`Unsupported TEST_BROWSER: ${browser}`);
                }
                return { browser };
              }),
          },
        },
      },
    ],
  },
});
