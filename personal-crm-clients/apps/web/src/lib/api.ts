import { ApiClient, type ApiClientOptions } from "@personal-crm/api-client";

export function createApiClient(options: Omit<ApiClientOptions, "baseUrl">) {
  return new ApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1",
    ...options
  });
}

