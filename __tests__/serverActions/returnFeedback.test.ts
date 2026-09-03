/**
 * @jest-environment node
 */
import { Types } from "mongoose";
import { auth } from "../../auth";
import {
  closeDatabase,
  clearDatabase,
  connect,
  createDummyGuide,
  createDummyReturn,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { Review, Vote } from "models/review";
import { returnReview } from "serverActions/returnFeedback";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("returnReview", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  const signInAs = (id: Types.ObjectId) =>
    (auth as jest.Mock).mockResolvedValue({ user: { id: id.toString() } });

  /** A guide, a project on it by `author`, and a reviewer who is not the author. */
  const scenario = async () => {
    const guide = await createDummyGuide();
    const author = await createDummyUser();
    const reviewer = await createDummyUser();
    const project = await createDummyReturn(author, guide);
    signInAs(reviewer._id);
    return {
      guide,
      author,
      reviewer,
      project,
      input: {
        vote: Vote.PASS,
        comment: "Great job!",
        returnId: project._id.toString(),
        guideId: guide._id.toString(),
      },
    };
  };

  it("stores a review of somebody else's return", async () => {
    const { reviewer, project, guide, input } = await scenario();

    const result = await returnReview(undefined, {
      ...input,
      vote: Vote.RECOMMEND_TO_GALLERY,
    });

    expect(result).toEqual({
      success: true,
      data: undefined,
      message: "Review submitted successfully",
    });
    const stored = await Review.findOne({ return: project._id }).lean();
    expect(stored).toEqual(
      expect.objectContaining({
        vote: Vote.RECOMMEND_TO_GALLERY,
        comment: "Great job!",
        owner: reviewer._id,
        return: project._id,
        guide: guide._id,
      })
    );
  });

  it("should return an error if form validation fails", async () => {
    const input = {
      vote: undefined,
      comment: undefined,
      returnId: undefined,
      guideId: undefined,
    };
    const result = await returnReview(undefined, input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toBeDefined();
    }
  });

  it("rejects ids that are not ObjectIds before touching the database", async () => {
    const { input } = await scenario();

    const result = await returnReview(undefined, {
      ...input,
      returnId: "not-an-id",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors?.returnId).toBeDefined();
  });

  it("requires a signed-in user", async () => {
    const { input } = await scenario();
    (auth as jest.Mock).mockResolvedValue(null);

    const result = await returnReview(undefined, input);

    expect(result.success).toBe(false);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("refuses a return that does not exist", async () => {
    const { input } = await scenario();

    const result = await returnReview(undefined, {
      ...input,
      returnId: new Types.ObjectId().toString(),
    });

    expect(result).toEqual(
      expect.objectContaining({ success: false, message: "Return not found" })
    );
  });

  it("refuses a return filed under a different guide", async () => {
    const { input } = await scenario();
    const otherGuide = await createDummyGuide();

    const result = await returnReview(undefined, {
      ...input,
      guideId: otherGuide._id.toString(),
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toMatch(/does not belong/i);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("refuses a review of the reviewer's own return", async () => {
    const { author, input } = await scenario();
    signInAs(author._id);

    const result = await returnReview(undefined, input);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toMatch(/your own return/i);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("refuses a second review of the same return by the same person", async () => {
    const { input } = await scenario();
    expect((await returnReview(undefined, input)).success).toBe(true);

    const result = await returnReview(undefined, input);

    expect(result.success).toBe(false);
    if (!result.success) expect(result.message).toMatch(/already reviewed/i);
    expect(await Review.countDocuments()).toBe(1);
  });

  it("should return an error if review submission fails", async () => {
    const { input } = await scenario();
    const create = jest
      .spyOn(Review, "create")
      .mockRejectedValueOnce(new Error("Database error"));

    const result = await returnReview(undefined, input);

    expect(result).toEqual(expect.objectContaining({ success: false }));
    create.mockRestore();
  });
});
