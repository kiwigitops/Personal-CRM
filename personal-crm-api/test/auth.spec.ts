import { describe, expect, it } from "vitest";

import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from "../src/lib/auth";

describe("auth tokens", () => {
  it("signs and verifies access tokens", () => {
    const token = signAccessToken({ userId: "user_123" }, "super-secret-value", 60);
    const payload = verifyAccessToken(token, "super-secret-value");

    expect(payload.userId).toBe("user_123");
    expect(payload.type).toBe("access");
  });

  it("signs and verifies refresh tokens", () => {
    const token = signRefreshToken(
      { sessionId: "session_123", userId: "user_123" },
      "another-secret-value",
      30,
    );
    const payload = verifyRefreshToken(token, "another-secret-value");

    expect(payload.sessionId).toBe("session_123");
    expect(payload.type).toBe("refresh");
  });
});

