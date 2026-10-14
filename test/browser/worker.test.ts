import { it } from "vitest";

it("imports the package and bounds adversarial work in a Web Worker", async () => {
  const worker = new Worker(new URL("./security.worker.ts", import.meta.url), { type: "module" });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await new Promise<void>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error("Browser security worker exceeded 60 seconds")), 60_000);
      worker.onerror = event => reject(new Error(event.message));
      worker.onmessage = event => {
        event.data.ok ? resolve() : reject(new Error(event.data.error));
      };
    });
  } finally {
    clearTimeout(timer);
    worker.terminate();
  }
}, 65_000);
