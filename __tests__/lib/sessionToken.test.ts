/**
 * @jest-environment node
 */
import type { JWT } from "next-auth/jwt";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { User } from "models/user";
import {
  REVALIDATE_AFTER_MS,
  refreshToken,
  snapshotUser,
} from "../../app/lib/sessionToken";

const stale = () => Date.now() - REVALIDATE_AFTER_MS - 1;

describe("session token re-validation", () => {
  beforeAll(async () => await connect());
  afterEach(async () => await clearDatabase());
  afterAll(async () => await closeDatabase());

  it("leaves a recently checked token alone without reading the database", async () => {
    const find = jest.spyOn(User, "findById");
    const token: JWT = { id: "x", role: "teacher", checkedAt: Date.now() };

    expect(await refreshToken(token)).toBe(token);
    expect(find).not.toHaveBeenCalled();
    find.mockRestore();
  });

  it("refreshes a stale token from the database", async () => {
    const user = await createDummyUser("teacher", { name: "Before" });
    const token = snapshotUser({}, user);
    token.checkedAt = stale();
    await User.updateOne({ _id: user._id }, { name: "After", role: "user" });

    const refreshed = await refreshToken(token);

    expect(refreshed).toEqual(
      expect.objectContaining({ id: user.id, name: "After", role: "user" })
    );
    expect(refreshed!.checkedAt).toBeGreaterThan(stale());
  });

  it("checks a token from before checkedAt existed at once", async () => {
    const user = await createDummyUser();
    await User.deleteOne({ _id: user._id });

    expect(await refreshToken({ id: user.id, role: "user" })).toBeNull();
  });

  it("signs out a deleted account", async () => {
    const user = await createDummyUser();
    const token = snapshotUser({}, user);
    token.checkedAt = stale();
    await User.deleteOne({ _id: user._id });

    expect(await refreshToken(token)).toBeNull();
  });

  it("signs out an account that is no longer active", async () => {
    const user = await createDummyUser();
    const token = snapshotUser({}, user);
    token.checkedAt = stale();
    await User.updateOne({ _id: user._id }, { status: "pending" });

    expect(await refreshToken(token)).toBeNull();
  });

  it("signs out a token with no user id", async () => {
    expect(await refreshToken({ checkedAt: stale() })).toBeNull();
  });

  it("keeps the session when the database is unreachable", async () => {
    const token: JWT = { id: "507f1f77bcf86cd799439011", checkedAt: stale() };
    const find = jest
      .spyOn(User, "findById")
      .mockRejectedValueOnce(new Error("down"));
    jest.spyOn(console, "error").mockImplementationOnce(() => {});

    expect(await refreshToken(token)).toBe(token);
    find.mockRestore();
  });
});
