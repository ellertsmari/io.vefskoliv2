import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyFeedback,
  createDummyGuide,
  createDummyReturn,
  createDummyReview,
  createDummyUser,
} from "./mongoHandler";
import { GuideInfo, getGuides } from "../../app/guides/query";
import { Types } from "mongoose";

// for type checking
function isGuideInfo(obj: any): obj is GuideInfo {
  return (
    typeof obj.returnStatus === "string" &&
    Array.isArray(obj.returnsSubmitted) &&
    Array.isArray(obj.feedbackReceived) &&
    typeof obj.feedbackToGiveStatus === "string" &&
    Array.isArray(obj.availableForFeedback) &&
    Array.isArray(obj.feedbackGiven) &&
    typeof obj.feedbackGivenCount === "number" &&
    typeof obj.reviewsReceivedStatus === "string" &&
    Array.isArray(obj.reviewsReceived) &&
    Array.isArray(obj.reviewsReceivedGrades) &&
    typeof obj.reviewsToGiveStatus === "string" &&
    Array.isArray(obj.reviewsGiven) &&
    Array.isArray(obj.availableToReview) &&
    obj._id instanceof Types.ObjectId
  );
}

describe("getGuides", () => {
  beforeAll(async () => await connect());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  it("gets returns correct data", async () => {
    const user = await createDummyUser();
    const reviewer = await createDummyUser(); // create a user to be the reviewer

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const userReturn2 = await createDummyReturn(undefined, guide);
    const userReturn3 = await createDummyReturn(user, guide);

    const review = await createDummyReview(user, guide, userReturn, reviewer);
    const review2 = await createDummyReview(undefined, guide, userReturn, user);
    const review3 = await createDummyReview(undefined, guide, userReturn, user);

    const feedback = await createDummyFeedback(undefined, guide, userReturn);
    const feedback2 = await createDummyFeedback(undefined, guide, userReturn);
    const feedback3 = await createDummyFeedback(user, guide, userReturn);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0]).toMatchObject({
        _id: expect.any(Types.ObjectId),
        title: guide.title,
        description: guide.description,
        category: guide.category,
        order: guide.order,
        module: {
          title: guide.module.title,
          number: guide.module.number,
        },
        returnStatus: expect.any(String),
        feedbackToGiveStatus: expect.any(String),
        feedbackGivenCount: expect.any(Number),
        reviewsReceivedStatus: expect.stringContaining("Reviews received"), // in practice users wouldnt review their own returns
        reviewsReceivedGrades: expect.arrayContaining([review.grade]),
        reviewsToGiveStatus: expect.any(String),
      });
      expect(guides[0].returnsSubmitted).toEqual(
        expect.arrayContaining([
          expect.objectContaining(userReturn.toObject()),
          expect.objectContaining(userReturn3.toObject()),
        ])
      );
      expect(guides[0].reviewsReceived).toEqual(
        expect.arrayContaining([expect.objectContaining(review.toObject())])
      );
      expect(guides[0].reviewsReceivedGrades).toEqual(
        expect.arrayContaining([review.grade])
      );
      expect(guides[0].reviewsGiven).toEqual(
        expect.arrayContaining([
          expect.objectContaining(review2.toObject()),
          expect.objectContaining(review3.toObject()),
        ])
      );
      expect(guides[0].availableToReview).toEqual(
        expect.arrayContaining([
          expect.objectContaining(feedback.toObject()),
          expect.objectContaining(feedback2.toObject()),
        ])
      );
      expect(guides[0].feedbackReceived).toEqual(
        expect.arrayContaining([expect.objectContaining(feedback.toObject())])
      );
      expect(guides[0].feedbackGiven).toEqual(
        expect.arrayContaining([expect.objectContaining(feedback3.toObject())])
      );
      expect(guides[0].availableForFeedback).toEqual(
        expect.arrayContaining([
          expect.objectContaining(userReturn2.toObject()),
        ])
      );
    }
  });

  it("returns GuideInfo[]", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const review = await createDummyReview(user, guide, userReturn);

    const guides = await getGuides(user);

    expect(guides).not.toBeNull();

    if (guides) {
      expect(isGuideInfo(guides[0])).toBe(true);
    }
  });
  it("returns empty array when there are no guides", async () => {
    const user = await createDummyUser();

    const guides = await getGuides(user);

    expect(guides).not.toBeNull();
    expect(guides).toEqual([]);
  });
  it("returns null when user is null", async () => {
    const guides = await getGuides(null);

    expect(guides).toBeNull();
  });
  it("sets the correct returnStatus", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0].returnStatus).toEqual("Returned");
    }
  });
  it("sets the correct returnStatus when no returns are submitted", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0].returnStatus).toEqual("Not returned");
    }
  });
});
