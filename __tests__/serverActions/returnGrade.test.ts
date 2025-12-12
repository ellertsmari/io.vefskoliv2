import { Types } from "mongoose";
import { GradeDataType, returnGrade } from "serverActions/returnGrade";
import { auth } from "../../auth";
import {
  closeDatabase,
  clearDatabase,
  createDummyReview,
  createDummyUser,
  createDummyReturn,
  createDummyGuide,
  connect,
} from "../__mocks__/mongoHandler";
import { Review } from "models/review";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

describe("returnGrade", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase(), 10000);
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  const grade = 5;

  it("should return a grade when user is authorized", async () => {
    // Create separate users for different roles
    const gradingUser = await createDummyUser(); // The user who will grade
    const returnOwner = await createDummyUser(); // The user who owns the return
    const reviewOwner = await createDummyUser(); // The user who wrote the review

    const guide = await createDummyGuide();
    const theReturn = await createDummyReturn(returnOwner, guide);
    const review = await createDummyReview(reviewOwner, guide, theReturn);

    const input = {
      reviewId: review._id.toString(),
      grade,
    };

    // The grading user is different from both the return owner and review owner
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: gradingUser._id.toString() },
    });
    const result = await returnGrade(undefined, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          grade,
        }),
      })
    );
  });

  it("should not allow grading own review", async () => {
    const reviewOwner = await createDummyUser();
    const returnOwner = await createDummyUser();

    const guide = await createDummyGuide();
    const theReturn = await createDummyReturn(returnOwner, guide);
    const review = await createDummyReview(reviewOwner, guide, theReturn);

    const input = {
      reviewId: review._id.toString(),
      grade,
    };

    // Try to grade own review
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: reviewOwner._id.toString() },
    });
    const result = await returnGrade(undefined, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "You cannot grade your own review",
      })
    );
  });

  it("should not allow grading reviews on own projects", async () => {
    const returnOwner = await createDummyUser();
    const reviewOwner = await createDummyUser();

    const guide = await createDummyGuide();
    const theReturn = await createDummyReturn(returnOwner, guide);
    const review = await createDummyReview(reviewOwner, guide, theReturn);

    const input = {
      reviewId: review._id.toString(),
      grade,
    };

    // Return owner tries to grade a review on their own project
    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: returnOwner._id.toString() },
    });
    const result = await returnGrade(undefined, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "You cannot grade reviews on your own projects",
      })
    );
  });

  it("should return an error if not logged in", async () => {
    const input: GradeDataType = {
      reviewId: new Types.ObjectId().toString(),
      grade,
    };

    (auth as jest.Mock).mockResolvedValueOnce(null);
    const result = await returnGrade(undefined, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "You must be logged in to give a grade",
      })
    );
  });

  it("should return an error if review not found", async () => {
    const gradingUser = await createDummyUser();
    const input: GradeDataType = {
      reviewId: new Types.ObjectId().toString(),
      grade,
    };

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: gradingUser._id.toString() },
    });
    const result = await returnGrade(undefined, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "Review not found",
      })
    );
  });
});
