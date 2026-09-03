/**
 * @jest-environment node
 */
import {
  clearDatabase,
  closeDatabase,
  connect,
} from "../__mocks__/mongoHandler";
import { RateLimit } from "models/rateLimit";
import { consume, isLimited, rateLimitKey, reset } from "utils/rateLimit";

describe("rate limiting", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  describe("rateLimitKey", () => {
    it("is opaque and case-insensitive", () => {
      const key = rateLimitKey("login:email", "Anna@Example.com");

      expect(key).toMatch(/^[0-9a-f]{64}$/);
      expect(key).toBe(rateLimitKey("login:email", "anna@example.com "));
      expect(key).not.toBe(rateLimitKey("signup:ip", "anna@example.com"));
    });
  });

  describe("consume", () => {
    it("allows up to the limit and blocks the next call", async () => {
      const key = rateLimitKey("test", "a");

      for (let i = 0; i < 3; i++) {
        expect(await consume(key, 3, 60)).toEqual({
          allowed: true,
          retryAfterSeconds: 0,
        });
      }

      const blocked = await consume(key, 3, 60);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
      expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
    });

    it("keeps keys apart", async () => {
      await consume(rateLimitKey("test", "a"), 1, 60);

      expect((await consume(rateLimitKey("test", "b"), 1, 60)).allowed).toBe(
        true
      );
    });

    it("starts over once the window has passed", async () => {
      const key = rateLimitKey("test", "a");
      await consume(key, 1, 60);
      // The TTL monitor has not run yet, so the expired row still exists.
      await RateLimit.updateOne({ key }, { expiresAt: new Date(Date.now() - 1) });

      expect((await consume(key, 1, 60)).allowed).toBe(true);
      const row = await RateLimit.findOne({ key }).lean();
      expect(row?.count).toBe(1);
      expect(row!.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("stores nothing but the key, a count and an expiry", async () => {
      await consume(rateLimitKey("test", "secret@example.com"), 1, 60);

      const rows = await RateLimit.find().lean();
      expect(rows).toHaveLength(1);
      expect(JSON.stringify(rows)).not.toContain("secret@example.com");
    });
  });

  describe("isLimited", () => {
    it("reports the limit without counting", async () => {
      const key = rateLimitKey("test", "a");

      expect((await isLimited(key, 2)).allowed).toBe(true);
      await consume(key, 2, 60);
      expect((await isLimited(key, 2)).allowed).toBe(true);
      await consume(key, 2, 60);

      const state = await isLimited(key, 2);
      expect(state.allowed).toBe(false);
      expect(state.retryAfterSeconds).toBeGreaterThan(0);
      expect((await RateLimit.findOne({ key }))?.count).toBe(2);
    });
  });

  describe("reset", () => {
    it("clears the counter", async () => {
      const key = rateLimitKey("test", "a");
      await consume(key, 1, 60);
      await consume(key, 1, 60);

      await reset(key);

      expect((await isLimited(key, 1)).allowed).toBe(true);
      expect((await consume(key, 1, 60)).allowed).toBe(true);
    });
  });
});
