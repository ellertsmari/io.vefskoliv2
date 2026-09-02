/**
 * @jest-environment node
 */
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { User } from "models/user";
import {
  approveUser,
  getPendingUsers,
  rejectUser,
} from "serverActions/approveUsers";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

const asTeacher = () =>
  (auth as jest.Mock).mockResolvedValue({
    user: { id: "t", role: "teacher" },
  });
const asStudent = () =>
  (auth as jest.Mock).mockResolvedValue({ user: { id: "s", role: "user" } });

describe("account approval", () => {
  beforeAll(async () => await connect());
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });
  afterAll(async () => await closeDatabase());

  it("accounts default to active, so existing users are unaffected", async () => {
    const user = await createDummyUser();
    expect(user.status).toBe("active");
  });

  describe("getPendingUsers", () => {
    it("lists only pending accounts, oldest first, for a teacher", async () => {
      await createDummyUser();
      const second = await createDummyUser("user", {
        status: "pending",
        name: "Second",
      });
      // Created later but registered earlier: timestamps keep a createdAt
      // supplied at creation (and ignore later updates to it).
      await createDummyUser("user", {
        status: "pending",
        name: "First",
        createdAt: new Date(2020, 0, 1),
      });
      asTeacher();

      const pending = await getPendingUsers();

      expect(pending.map((u) => u.name)).toEqual(["First", "Second"]);
      expect(pending[1]).toEqual({
        id: second._id.toString(),
        name: "Second",
        email: second.email,
        createdAt: expect.any(String),
      });
    });

    it("gives a student nothing", async () => {
      await createDummyUser("user", { status: "pending" });
      asStudent();

      expect(await getPendingUsers()).toEqual([]);
    });
  });

  describe("approveUser", () => {
    it("activates a pending account", async () => {
      const user = await createDummyUser("user", { status: "pending" });
      asTeacher();

      const result = await approveUser(user._id.toString());

      expect(result.success).toBe(true);
      const updated = await User.findById(user._id);
      expect(updated?.status).toBe("active");
    });

    it("refuses a student", async () => {
      const user = await createDummyUser("user", { status: "pending" });
      asStudent();

      const result = await approveUser(user._id.toString());

      expect(result.success).toBe(false);
      expect((await User.findById(user._id))?.status).toBe("pending");
    });

    it("reports an account that is not pending", async () => {
      const user = await createDummyUser();
      asTeacher();

      const result = await approveUser(user._id.toString());

      expect(result).toEqual(
        expect.objectContaining({
          success: false,
          message: "Pending account not found",
        })
      );
    });

    it("rejects a malformed id", async () => {
      asTeacher();
      expect((await approveUser("not-an-id")).success).toBe(false);
    });
  });

  describe("rejectUser", () => {
    it("deletes a pending account", async () => {
      const user = await createDummyUser("user", { status: "pending" });
      asTeacher();

      const result = await rejectUser(user._id.toString());

      expect(result.success).toBe(true);
      expect(await User.findById(user._id)).toBeNull();
    });

    it("never deletes an active account", async () => {
      const user = await createDummyUser();
      asTeacher();

      const result = await rejectUser(user._id.toString());

      expect(result.success).toBe(false);
      expect(await User.findById(user._id)).not.toBeNull();
    });

    it("refuses a student", async () => {
      const user = await createDummyUser("user", { status: "pending" });
      asStudent();

      expect((await rejectUser(user._id.toString())).success).toBe(false);
      expect(await User.findById(user._id)).not.toBeNull();
    });
  });
});
