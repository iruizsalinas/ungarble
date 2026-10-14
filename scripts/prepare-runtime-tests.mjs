import { build } from "esbuild";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { sharedExclude } from "./runtime-suite.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const consumer = resolve(root, ".ci/consumer");
await mkdir(consumer, { recursive: true });
const npm = (...args) => execFileSync(process.execPath, [process.env.npm_execpath, ...args, "--cache", resolve(root, ".ci/npm-cache")], { stdio: "inherit", cwd: root });
npm("pack", "--pack-destination", ".ci", "--ignore-scripts");
const { version } = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
await writeFile(resolve(consumer, "package.json"), JSON.stringify({ private: true, type: "module" }));
npm("install", "--prefix", consumer, "--ignore-scripts", "--no-audit", "--no-fund", resolve(root, `.ci/ungarble-${version}.tgz`));

async function tests(dir) {
  const entries = await readdir(resolve(root, dir), { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? tests(`${dir}/${entry.name}`) : entry.name.endsWith(".test.ts") ? [`${dir}/${entry.name}`] : []));
  return nested.flat().sort();
}
const files = (await Promise.all(["test/integration", "test/unit", "test/security"].map(tests)))
  .flat().filter(file => !sharedExclude.includes(file));
const base = { bundle: true, format: "esm", platform: "neutral", target: "es2022", logLevel: "warning",
  mainFields: ["module", "main"], ignoreAnnotations: true };
for (const runtime of ["node", "bun", "deno"]) {
  for (const format of runtime === "node" ? ["esm", "cjs"] : ["esm"]) {
    await build({
      ...base,
      stdin: { contents: files.map(file => `import ${JSON.stringify(`./${file}`)};`).join("\n"), resolveDir: root },
      outfile: resolve(consumer, `${runtime}-${format}.test.mjs`),
      external: ["node:*", "bun:test", "ungarble"],
      plugins: [{ name: "runtime-adapter", setup(builder) {
        builder.onResolve({ filter: /^vitest$/ }, () => ({ path: resolve(root, `scripts/adapters/${runtime}.mjs`) }));
        builder.onResolve({ filter: /(?:src\/index\.js|dist\/index\.js)$/ }, () => ({ path: "package-api", namespace: "api" }));
        builder.onLoad({ filter: /.*/, namespace: "api" }, () => ({
          contents: format === "cjs"
            ? 'import { createRequire } from "node:module"; export const ungarble = createRequire(import.meta.url)("ungarble").ungarble;'
            : 'export { ungarble } from "ungarble";',
          loader: "js", resolveDir: consumer,
        }));
      } }],
    });
  }
}
await build({ ...base, entryPoints: [resolve(root, "test/support/security-payloads.ts")], outfile: resolve(root, ".ci/security-payloads.mjs") });
await build({ ...base, entryPoints: [resolve(root, "scripts/security-entry.ts")], external: ["ungarble"], outfile: resolve(consumer, "security.mjs") });
await build({ ...base, entryPoints: [resolve(root, "scripts/cloudflare-worker.ts")],
  alias: { ungarble: resolve(consumer, "node_modules/ungarble/dist/index.js") },
  outfile: resolve(root, ".ci/cloudflare-worker.mjs") });
await writeFile(resolve(root, ".ci/suite.json"), JSON.stringify({ files, excluded: sharedExclude }, null, 2));
const typecheck = `import { ungarble, type UngarbleConfig, type FixResult } from "ungarble";
const options: UngarbleConfig = { html: "auto", normalization: "NFC", limit: 100 };
const text: string = ungarble("cafÃ©", options);
const explanation: FixResult = ungarble.explain(text, options);
const detected: boolean = ungarble.detect(explanation.text);
// @ts-expect-error invalid option must be rejected by the published declarations
ungarble(text, { normalization: "invalid" });
// @ts-expect-error incorrect result type must be rejected
const incorrect: number = ungarble(text);
console.log(detected);
`;
for (const extension of ["mts", "cts"]) await writeFile(resolve(consumer, `typecheck.${extension}`), typecheck);
console.log(`Prepared ${files.length} shared test files against the installed package in ${relative(root, consumer)}`);
