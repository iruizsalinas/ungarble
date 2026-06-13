import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: false,
  outExtensions({ format }) {
    return format === "es"
      ? { js: ".js", dts: ".d.ts" }
      : { js: ".cjs", dts: ".d.cts" };
  },
  target: "node18",
});
