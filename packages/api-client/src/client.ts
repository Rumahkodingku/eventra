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
    if (typeof document !== "undefined") {
      const csrf = document.cookie
        .split("; ")
        .find((entry) => entry.startsWith("eventra_csrf="))
        ?.slice("eventra_csrf=".length);
      if (csrf) {
        request.headers.set("X-CSRF-Token", decodeURIComponent(csrf));
      }
    }
    return request;
  },
};

export function createApiClient(options: ApiClientOptions = {}) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl ?? "/api/v1",
    credentials: "include",
    fetch: options.fetch,
    headers: {
      Accept: "application/json",
    },
  });
  client.use(requestID);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
