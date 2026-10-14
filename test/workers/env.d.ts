declare module "cloudflare:workers" {
  export const env: { PACKAGE_WORKER: { fetch(url: string): Promise<Response> } };
}
