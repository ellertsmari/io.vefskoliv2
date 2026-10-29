/**
 * @jest-environment node
 */
import {
  loadPublicGuideBoard,
  loadStudentGuideBoard,
} from "serverActions/guideBoard";
import { getGuides } from "serverActions/getGuides";
import { getPublicGuides } from "serverActions/getPublicGuides";
import { ReturnStatus } from "types/guideTypes";

jest.mock("serverActions/getGuides", () => ({ getGuides: jest.fn() }));
jest.mock("serverActions/getPublicGuides", () => ({
  getPublicGuides: jest.fn(),
}));

const stored = (title: string, number: number) => ({
  _id: `id-${title}`,
  title: `A guide in ${title}`,
  description: "",
  category: "code",
  order: 1,
  module: { title, number },
});

describe("guide boards", () => {
  afterEach(() => jest.resetAllMocks());

  it("takes the module number from the title, not the stored field", async () => {
    // Hand-imported guides carry stale numbers; the title is what every view
    // has always gone by.
    (getPublicGuides as jest.Mock).mockResolvedValue([
      stored("3 - Undirstöður", 1),
      stored("Module 2", 2),
    ]);

    const board = await loadPublicGuideBoard();

    expect(board!.guides.map((g) => g.module.number)).toEqual([3, 0]);
    expect(board!.modules.map((m) => m.number)).toEqual([0, 3]);
  });

  it("gives visitors every guide as not returned", async () => {
    (getPublicGuides as jest.Mock).mockResolvedValue([stored("1 - Intro", 1)]);

    const board = await loadPublicGuideBoard();

    expect(board!.guides[0].returnStatus).toBe(ReturnStatus.NOT_RETURNED);
    expect(board!.guides[0].link).toBe("/guides/id-1 - Intro");
  });

  it("is null for visitors when the guides can't be loaded", async () => {
    (getPublicGuides as jest.Mock).mockResolvedValue(null);
    expect(await loadPublicGuideBoard()).toBeNull();
  });

  it("is empty when nobody is signed in", async () => {
    (getGuides as jest.Mock).mockResolvedValue(null);
    expect(await loadStudentGuideBoard()).toEqual({ guides: [], modules: [] });
  });

  it("throws when a student's guides can't be loaded", async () => {
    // So the page shows its error state, not an empty board.
    (getGuides as jest.Mock).mockRejectedValue(new Error("db down"));
    await expect(loadStudentGuideBoard()).rejects.toThrow("db down");
  });
});
