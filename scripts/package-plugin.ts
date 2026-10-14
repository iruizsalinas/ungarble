import { resolve } from "node:path";
import type { Plugin } from "vite";

// Public behavioral tests exercise the package installed from npm pack.
// Private unit tests still exercise their original source modules.
export function installedPackage(): Plugin {
  const root = process.cwd();
  return {
    name: "test-installed-package",
    enforce: "pre",
    resolveId(id, importer) {
      if (!importer || !id.startsWith(".")) return;
      const target = resolve(importer, "..", id);
      if ([resolve(root, "src/index.js"), resolve(root, "dist/index.js")].includes(target)) {
        return resolve(root, ".ci/consumer/node_modules/ungarble/dist/index.js");
      }
      return undefined;
    },
  };
}
