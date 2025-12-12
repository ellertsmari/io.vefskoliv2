import { Types } from "mongoose";
import { auth } from "../../auth";
import {
  closeDatabase,
  clearDatabase,
  createDummyReview,
  connect,
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
  const returnId = new Types.ObjectId().toString();
  const guideId = new Types.ObjectId().toString();
  const reviewUserId = new Types.ObjectId();
  it("should submit a review", async () => {
    const vote = Vote.RECOMMEND_TO_GALLERY;
    const comment = "Great job!";
    const input = {
      vote,
      comment,
      returnId,
      guideId,
    };
    Review.create = jest.fn();
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: reviewUserId },
    });
    const result = await returnReview(undefined, input);
    expect(Review.create).toHaveBeenCalledWith({
      vote,
      comment,
      owner: reviewUserId,
      return: new Types.ObjectId(returnId),
      guide: new Types.ObjectId(guideId),
    });
    expect(result).toEqual({
      success: true,
      data: undefined,
      message: "Review submitted successfully",
    });
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
  it("should return an error if review submission fails", async () => {
    const vote = Vote.PASS;
    const comment = "Great job!";
    const input = {
      vote,
      comment,
      returnId,
      guideId: new Types.ObjectId().toString(),
    };
    Review.create = jest.fn().mockRejectedValue(new Error("Database error"));
    const result = await returnReview(undefined, input);
    expect(result).toEqual(expect.objectContaining({ success: false }));
  });
});
