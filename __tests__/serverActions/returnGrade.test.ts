import { Types } from "mongoose";
import { GradeDataType, returnGrade } from "serverActions/returnGrade";
import { auth } from "../../auth";
import {
  closeDatabase,
  clearDatabase,
  createDummyFeedback,
  connect,
} from "../__mocks__/mongoHandler";
import { Review } from "models/review";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

describe("returnGrade", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  const grade = 5;

  const gradeUserId = new Types.ObjectId();

  it("should return a grade", async () => {
    const feedback = await createDummyFeedback();
    const input = {
      reviewId: feedback._id.toString(),
      grade,
    };

    (auth as jest.Mock).mockResolvedValueOnce({
      user: { id: gradeUserId },
    });
    const result = await returnGrade({}, input);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          grade,
        }),
      })
    );
  });

  it("should return an error if grade submission fails", async () => {
    const input: GradeDataType = {
      reviewId: "123",
      grade,
    };

    Review.updateOne = jest.fn().mockRejectedValue(new Error("Database error"));

    const result = await returnGrade({}, input);

    expect(result).toEqual(expect.objectContaining({ success: false }));
  });
});
