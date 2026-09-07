/**
 * @jest-environment node
 */
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyGuide,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { Guide } from "models/guide";
import { deleteGuide, getGuidesForEditor } from "serverActions/editGuideActions";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("editGuideActions", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  const signInAs = (role: string) =>
    (auth as jest.Mock).mockResolvedValue({ user: { id: "abc", role } });

  it("lists every guide in module order, surviving hand-imported field shapes", async () => {
    const a = await createDummyGuide();
    const b = await createDummyGuide();
    // What a Compass import leaves behind: dates as strings or missing, and
    // an order stored as text. These used to throw and empty the whole list.
    await Guide.collection.updateOne(
      { _id: a._id },
      { $set: { module: { title: "3 - The fundamentals" }, order: "2", updatedAt: "2026-08-12T10:00:00.000Z" } }
    );
    await Guide.collection.updateOne(
      { _id: b._id },
      { $set: { module: { title: "1 - Introductory Course" }, order: 5 }, $unset: { updatedAt: 1 } }
    );
    signInAs("teacher");

    const rows = await getGuidesForEditor();

    expect(rows.map((row) => row.moduleNumber)).toEqual([1, 3]);
    expect(rows[1]).toEqual(
      expect.objectContaining({ id: String(a._id), order: 2, updatedAt: "2026-08-12T10:00:00.000Z" })
    );
    expect(rows[0].updatedAt).toBe(new Date(0).toISOString());
  });

  it("is empty for students", async () => {
    await createDummyGuide();
    signInAs("user");
    expect(await getGuidesForEditor()).toEqual([]);
  });

  it("lets a teacher delete a guide, and nobody else", async () => {
    const guide = await createDummyGuide();
    await createDummyUser();
    signInAs("user");
    expect((await deleteGuide(String(guide._id))).success).toBe(false);
    signInAs("teacher");
    expect((await deleteGuide(String(guide._id))).success).toBe(true);
    expect(await Guide.countDocuments()).toBe(0);
    expect((await deleteGuide(String(guide._id))).success).toBe(false);
  });
});
