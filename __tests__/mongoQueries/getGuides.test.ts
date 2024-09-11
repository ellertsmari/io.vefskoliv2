import {
  clearDatabase,
  closeDatabase,
  connect,
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
    typeof obj.category === "string" &&
    typeof obj.description === "string" &&
    typeof obj.isReturned === "boolean" &&
    typeof obj.order === "number" &&
    typeof obj.title === "string" &&
    Array.isArray(obj.returnsSubmitted) &&
    Array.isArray(obj.reviewsGiven) &&
    typeof obj.numberOfReviewsGiven === "number" &&
    Array.isArray(obj.reviewsReceived) &&
    Array.isArray(obj.returnsToReview) &&
    obj._id instanceof Types.ObjectId
  );
}

describe("getGuides", () => {
  beforeAll(async () => await connect());

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  it("gets guides", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const review = await createDummyReview(user, guide, userReturn);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0]).toMatchObject({
        category: guide.category,
        title: guide.title,
        description: guide.description,
        module: {
          title: guide.module.title,
          number: guide.module.number,
        },
        order: guide.order,
        numberOfReviewsGiven: 1,
        isReturned: true,
      });
      expect(guides[0].returnsSubmitted[0]).toMatchObject({
        projectUrl: userReturn.projectUrl,
        liveVersion: userReturn.liveVersion,
        pictureUrl: userReturn.pictureUrl,
        projectName: userReturn.projectName,
        comment: userReturn.comment,
      });
      expect(guides[0].reviewsGiven[0]).toMatchObject({
        guide: review.guide,
        return: review.return,
        owner: review.owner,
        comment: review.comment,
        vote: review.vote,
      });
      expect(guides[0].reviewsReceived[0]).toBeUndefined();
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
  it("returns correct Reviews in reviewsReceived", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    await createDummyReview(user, guide, userReturn);
    const review2 = await createDummyReview(undefined, guide, userReturn);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0].reviewsReceived[0]._id).toEqual(review2._id);
      expect(guides[0].reviewsReceived.length).toBe(1);
    }
  });
  it("returns correct Returns in returnsToReview", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    await createDummyReview(user, guide, userReturn);
    const userReturn2 = await createDummyReturn(undefined, guide);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0].returnsToReview[0]._id).toEqual(userReturn2._id);
      expect(guides[0].returnsToReview.length).toBe(1);
    }
  });
  it("returns correct number of reviewsGiven", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    await createDummyReview(user, guide, userReturn);
    await createDummyReview(user, guide, userReturn);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides[0].numberOfReviewsGiven).toBe(2);
    }
  });
  it("returns correct returnsSubmitted", async () => {
    const user = await createDummyUser();

    const guide1 = await createDummyGuide();
    const guide2 = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide1);
    const userReturn2 = await createDummyReturn(user, guide1);
    const userReturn3 = await createDummyReturn(user, guide2);

    await createDummyReturn(undefined, guide1);

    const guides = await getGuides(user);

    if (guides) {
      expect(guides.length).toBe(2);
      guides.forEach((guide) => {
        if (guide._id.equals(guide2._id)) {
          expect(guide.returnsSubmitted.length).toBe(1);
          expect(guide.returnsSubmitted[0]._id).toEqual(userReturn3._id);
        } else if (guide._id.equals(guide1._id)) {
          expect(guide.returnsSubmitted.length).toBe(2);
          expect(guide.returnsSubmitted[0]._id).toEqual(userReturn._id);
        } else {
          expect(false).toBe(true);
        }
      });
    }
  });
});
