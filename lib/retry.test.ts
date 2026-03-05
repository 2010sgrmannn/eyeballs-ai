import { describe, it, expect } from "bun:test";
import { withRetry } from "./retry";

describe("withRetry", () => {
  it("returns result on first success", async () => {
    const result = await withRetry(() => Promise.resolve("ok"));
    expect(result).toBe("ok");
  });

  it("retries on failure and succeeds", async () => {
    let attempts = 0;
    const result = await withRetry(
      () => {
        attempts++;
        if (attempts < 3) throw new Error("fail");
        return Promise.resolve("recovered");
      },
      { maxRetries: 2, backoffMs: 10, label: "test" }
    );
    expect(result).toBe("recovered");
    expect(attempts).toBe(3);
  });

  it("throws after exhausting retries", async () => {
    let attempts = 0;
    try {
      await withRetry(
        () => {
          attempts++;
          throw new Error("always fails");
        },
        { maxRetries: 2, backoffMs: 10, label: "test" }
      );
      throw new Error("should not reach here");
    } catch (err) {
      expect((err as Error).message).toBe("always fails");
      expect(attempts).toBe(3); // 1 initial + 2 retries
    }
  });

  it("works with zero retries", async () => {
    let attempts = 0;
    try {
      await withRetry(
        () => {
          attempts++;
          throw new Error("no retries");
        },
        { maxRetries: 0 }
      );
    } catch (err) {
      expect((err as Error).message).toBe("no retries");
      expect(attempts).toBe(1);
    }
  });
});
