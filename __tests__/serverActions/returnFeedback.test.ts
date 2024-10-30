import { Types } from "mongoose";
import { auth } from "../../auth";
import {
  closeDatabase,
  clearDatabase,
  createDummyFeedback,
  connect,
} from "../__mocks__/mongoHandler";
import { Review, Vote } from "models/review";
import { FeedbackDataType, returnFeedback } from "serverActions/returnFeedback";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("returnFeedback", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });
  const returnId = new Types.ObjectId().toString();
  const guideId = new Types.ObjectId().toString();
  const feedbackUserId = new Types.ObjectId();
  it("should return feedback", async () => {
    const vote = Vote.RECOMMEND_TO_GALLERY;
    const comment = "Great job!";
    const input: FeedbackDataType = {
      vote,
      comment,
      returnId,
      guideId,
    };
    Review.create = jest.fn();
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: feedbackUserId },
    });
    const result = await returnFeedback({}, input);
    expect(Review.create).toHaveBeenCalledWith({
      vote,
      comment,
      owner: feedbackUserId,
      return: new Types.ObjectId(returnId),
      guide: new Types.ObjectId(guideId),
    });
    expect(result).toEqual({
      success: true,
      message: "Return feedback submitted successfully",
    });
  });
  it("should return an error if form validation fails", async () => {
    const vote = Vote.PASS;
    const comment = "Great job!";
    const input: FeedbackDataType = {
      vote: undefined,
      comment: undefined,
      returnId: undefined,
      guideId: undefined,
    };
    const result = await returnFeedback({}, input);
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
  it("should return an error if feedback submission fails", async () => {
    const vote = Vote.PASS;
    const comment = "Great job!";
    const input: FeedbackDataType = {
      vote,
      comment,
      returnId,
      guideId: new Types.ObjectId().toString(),
    };
    Review.create = jest.fn().mockRejectedValue(new Error("Database error"));
    const result = await returnFeedback({}, input);
    expect(result).toEqual(expect.objectContaining({ success: false }));
  });
});
