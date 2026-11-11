import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/schema";

export interface ApiClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

const requestID: Middleware = {
  async onRequest({ request }) {
    if (!request.headers.has("X-Request-ID")) {
      request.headers.set("X-Request-ID", crypto.randomUUID());
    }
    return request;
  },
};

export function createApiClient(options: ApiClientOptions = {}) {
  return createClient<paths>({
    baseUrl: options.baseUrl ?? "/api/v1",
    credentials: "include",
    fetch: options.fetch,
    headers: {
      Accept: "application/json",
    },
  }).use(requestID);
}

export type ApiClient = ReturnType<typeof createApiClient>;
export type { paths };
