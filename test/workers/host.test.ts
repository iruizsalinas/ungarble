import { expect, it } from "vitest";
import { env } from "cloudflare:workers";
import { ungarble } from "../../dist/index.js";
import { runSecurityPayloads } from "../support/security-payloads.js";

it("executes inside Workers with native Web APIs", () => {
  expect(navigator.userAgent).toContain("Cloudflare-Workers");
  expect(TextEncoder).toBeDefined();
  expect(TextDecoder).toBeDefined();
  expect(ungarble("cafÃ©")).toBe("café");
});

it("handles the shared adversarial payloads inside workerd", () => {
  runSecurityPayloads(ungarble, { equal: (actual, expected) => expect(actual).toBe(expected) });
});

it("runs the packaged consumer without Node compatibility", async () => {
  const bindings = env as unknown as { PACKAGE_WORKER: { fetch(url: string): Promise<Response> } };
  const response = await bindings.PACKAGE_WORKER.fetch("https://package.test/");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ text: "café", nodeGlobals: "undefined" });
});
