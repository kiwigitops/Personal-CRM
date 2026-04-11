import { describe, expect, it } from "vitest";

import { createApiClient } from "./api";

describe("createApiClient", () => {
  it("creates a typed client with auth callbacks", () => {
    const client = createApiClient({
      getToken: () => "token",
      getWorkspaceId: () => "workspace"
    });

    expect(client).toBeDefined();
  });
});
