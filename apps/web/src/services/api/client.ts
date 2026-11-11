import { createApiClient } from "@eventra/api-client";

export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1",
});
