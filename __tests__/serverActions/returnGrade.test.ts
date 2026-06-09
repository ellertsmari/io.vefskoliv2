/**
 * @jest-environment node
 */
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

  it("should grade a review when the user is a teacher", async () => {
    const teacher = await createDummyUser();
    const returnOwner = await createDummyUser();
    const reviewOwner = await createDummyUser();

    const guide = await createDummyGuide();
    const theReturn = await createDummyReturn(returnOwner, guide);
    const review = await createDummyReview(reviewOwner, guide, theReturn);

    const input = {
      reviewId: review._id.toString(),
      grade,
    };

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: teacher._id.toString(), role: "teacher" },
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

  it("should let a teacher re-grade an already-graded review", async () => {
    const teacher = await createDummyUser();
    const returnOwner = await createDummyUser();
    const reviewOwner = await createDummyUser();

    const guide = await createDummyGuide();
    const theReturn = await createDummyReturn(returnOwner, guide);
    const review = await createDummyReview(reviewOwner, guide, theReturn);
    await Review.updateOne({ _id: review._id }, { grade: 3 });

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: teacher._id.toString(), role: "teacher" },
    });
    const result = await returnGrade(undefined, {
      reviewId: review._id.toString(),
      grade: 9,
    });

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ grade: 9 }),
      })
    );
  });

  it("should reject a non-teacher (student) trying to grade", async () => {
    const student = await createDummyUser();
    const returnOwner = await createDummyUser();
    const reviewOwner = await createDummyUser();

    const guide = await createDummyGuide();
    const theReturn = await createDummyReturn(returnOwner, guide);
    const review = await createDummyReview(reviewOwner, guide, theReturn);

    const input = {
      reviewId: review._id.toString(),
      grade,
    };

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: student._id.toString(), role: "student" },
    });
    const result = await returnGrade(undefined, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: "Only teachers can grade reviews",
      })
    );

    // And the grade must not have been written.
    const untouched = await Review.findById(review._id);
    expect(untouched?.grade ?? null).toBeNull();
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
    const teacher = await createDummyUser();
    const input: GradeDataType = {
      reviewId: new Types.ObjectId().toString(),
      grade,
    };

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: teacher._id.toString(), role: "teacher" },
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
