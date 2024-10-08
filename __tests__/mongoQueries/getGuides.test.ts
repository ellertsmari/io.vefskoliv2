import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyFeedback,
  createDummyGuide,
  createDummyReturn,
  createDummyGrade,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { getGuides } from "../../app/guides/query";
import { Types } from "mongoose";
import { GuideInfo } from "../../app/guides/types";

// for type checking
function isGuideInfo(obj: any): obj is GuideInfo {
  return (
    Array.isArray(obj.returnsSubmitted) &&
    Array.isArray(obj.feedbackReceived) &&
    Array.isArray(obj.availableForFeedback) &&
    Array.isArray(obj.feedbackGiven) &&
    Array.isArray(obj.gradesReceived) &&
    Array.isArray(obj.gradesGiven) &&
    Array.isArray(obj.availableToGrade) &&
    obj._id instanceof Types.ObjectId
  );
}

describe("getGuides", () => {
  beforeAll(async () => await connect());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  it("gets returns correct data", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const userReturn2 = await createDummyReturn(undefined, guide);
    const userReturn3 = await createDummyReturn(user, guide);

    const review = await createDummyGrade(user, guide, userReturn);
    const review2 = await createDummyGrade(undefined, guide, userReturn);
    const review3 = await createDummyGrade(undefined, guide, userReturn);

    const feedback = await createDummyFeedback(undefined, guide, userReturn);
    const feedback2 = await createDummyFeedback(undefined, guide, userReturn);
    const feedback3 = await createDummyFeedback(user, guide, userReturn);

    const guides = await getGuides(user._id.toString());

    if (guides) {
      expect(guides[0]).toMatchObject({
        _id: expect.any(Types.ObjectId),
        title: guides[0].title,
        description: guides[0].description,
        category: guides[0].category,
        order: guides[0].order,
        module: {
          title: guides[0].module.title,
          number: guides[0].module.number,
        },
      });
      expect(guides[0].returnsSubmitted).toEqual(
        expect.arrayContaining([
          expect.objectContaining(userReturn.toObject()),
          expect.objectContaining(userReturn3.toObject()),
        ])
      );
      expect(guides[0].gradesReceived).toEqual(
        expect.arrayContaining([expect.objectContaining(review.toObject())])
      );

      expect(guides[0].gradesGiven).toEqual(
        expect.arrayContaining([
          expect.objectContaining(review2.toObject()),
          expect.objectContaining(review3.toObject()),
        ])
      );
      expect(guides[0].availableToGrade).toEqual(
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

    const review = await createDummyGrade(user, guide, userReturn);

    const guides = await getGuides(user._id.toString());

    expect(guides).not.toBeNull();

    if (guides) {
      expect(isGuideInfo(guides[0])).toBe(true);
    }
  });
  it("returns empty array when there are no guides", async () => {
    const user = await createDummyUser();

    const guides = await getGuides(user._id.toString());

    expect(guides).not.toBeNull();
    expect(guides).toEqual([]);
  });
});
