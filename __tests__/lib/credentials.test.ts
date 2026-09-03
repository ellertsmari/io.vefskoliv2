/**
 * @jest-environment node
 */
import bcrypt from "bcrypt";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { RateLimit } from "models/rateLimit";
import { LOGIN_LIMITS, verifyCredentials } from "../../app/lib/credentials";
import {
  PendingApprovalError,
  RateLimitedError,
} from "../../app/lib/authErrors";

const PASSWORD = "correct horse battery";
// Low cost keeps the suite fast; the strength of the hash is not under test.
const hash = () => bcrypt.hash(PASSWORD, 4);

const attempt = (email: string, password = "wrong", ip = "203.0.113.1") =>
  verifyCredentials({ email, password, ip });

describe("verifyCredentials", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  it("returns the user for the right password", async () => {
    const user = await createDummyUser("user", { password: await hash() });

    const result = await attempt(user.email, PASSWORD);

    expect(result?._id.toString()).toBe(user._id.toString());
  });

  it("returns null for a wrong password and for an unknown address", async () => {
    const user = await createDummyUser("user", { password: await hash() });

    expect(await attempt(user.email, "nope")).toBeNull();
    expect(await attempt("nobody@example.com", PASSWORD)).toBeNull();
  });

  it("refuses a pending account only after the password matched", async () => {
    const user = await createDummyUser("user", {
      password: await hash(),
      status: "pending",
    });

    await expect(attempt(user.email, PASSWORD)).rejects.toBeInstanceOf(
      PendingApprovalError
    );
    expect(await attempt(user.email, "nope")).toBeNull();
  });

  it("locks an address after too many failures, even with the right password", async () => {
    const user = await createDummyUser("user", { password: await hash() });

    for (let i = 0; i < LOGIN_LIMITS.perEmail.limit; i++) {
      expect(await attempt(user.email)).toBeNull();
    }

    await expect(attempt(user.email, PASSWORD)).rejects.toBeInstanceOf(
      RateLimitedError
    );
  });

  it("treats the address case-insensitively when counting", async () => {
    for (let i = 0; i < LOGIN_LIMITS.perEmail.limit; i++) {
      await attempt("Anna@Example.com");
    }

    await expect(attempt("anna@example.com")).rejects.toBeInstanceOf(
      RateLimitedError
    );
  });

  it("forgets earlier failures once the owner signs in", async () => {
    const user = await createDummyUser("user", { password: await hash() });
    for (let i = 0; i < LOGIN_LIMITS.perEmail.limit - 1; i++) {
      await attempt(user.email);
    }

    await attempt(user.email, PASSWORD);

    for (let i = 0; i < LOGIN_LIMITS.perEmail.limit - 1; i++) {
      expect(await attempt(user.email)).toBeNull();
    }
    expect(await attempt(user.email, PASSWORD)).not.toBeNull();
  });

  it("locks a connection that fails across many addresses", async () => {
    for (let i = 0; i < LOGIN_LIMITS.perIp.limit; i++) {
      await attempt(`user${i}@example.com`);
    }

    await expect(attempt("another@example.com")).rejects.toBeInstanceOf(
      RateLimitedError
    );
    // A different connection is unaffected.
    expect(
      await attempt("another@example.com", "wrong", "198.51.100.7")
    ).toBeNull();
  });

  it("does not count successful sign-ins against the connection", async () => {
    const user = await createDummyUser("user", { password: await hash() });

    for (let i = 0; i < LOGIN_LIMITS.perIp.limit + 1; i++) {
      expect(await attempt(user.email, PASSWORD)).not.toBeNull();
    }
    expect(await RateLimit.countDocuments()).toBe(0);
  });
});
