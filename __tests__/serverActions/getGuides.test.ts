import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyFeedback,
  createDummyFeedbackWithReturn,
  createDummyGuide,
  createDummyReturn,
  createDummyGrade,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { Types } from "mongoose";
import { GuideInfo } from "types/guideTypes";
import { Review } from "models/review";
import { ReturnDocument } from "models/return";
import { getGuides } from "serverActions/getGuides";
import exp from "constants";

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

  describe("availableForFeedback", () => {
    afterEach(async () => await clearDatabase());

    it("only returns latest return from each user", async () => {
      const userA = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(userA, guide);
      const otherUserReturn = await createDummyReturn(undefined, guide);
      const otherUserReturn2 = await createDummyReturn(undefined, guide);

      const feedbackOnReturn = await createDummyFeedback(
        undefined,
        guide,
        userReturn
      );

      const guides = await getGuides(userA._id.toString());

      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForFeedback;
      const expected = expect.arrayContaining([
        {
          ...otherUserReturn.toObject(),
          associatedReviewCount: 0,
        },
        {
          ...otherUserReturn2.toObject(),
          associatedReviewCount: 0,
        },
      ]);

      expect(actual).toEqual(expected);
    });

    it("provides an array with the returns with the least feedback first", async () => {
      const userB = await createDummyUser();

      const guide = await createDummyGuide();

      const aReturn = await createDummyReturn(undefined, guide);
      const anotherReturn = await createDummyReturn(undefined, guide);

      const feedbackOnAReturn = await createDummyFeedback(
        undefined,
        guide,
        aReturn
      );

      const feedbackOnAnotherReturn = await createDummyFeedback(
        undefined,
        guide,
        anotherReturn
      );

      const moreFeedbackOnAnotherReturn = await createDummyFeedback(
        undefined,
        guide,
        anotherReturn
      );

      const guides = await getGuides(userB._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForFeedback;
      const expected = [
        { ...aReturn.toObject(), associatedReviewCount: 1 },
        { ...anotherReturn.toObject(), associatedReviewCount: 2 },
      ];

      expect(actual).toEqual(expected);
    });

    it("only contains the latest return from a user", async () => {
      const userC = await createDummyUser();
      const otherUserA = await createDummyUser();

      const guide = await createDummyGuide();

      const otherUserReturn = await createDummyReturn(otherUserA, guide);
      const otherUserReturn2 = await createDummyReturn(otherUserA, guide);

      const feedbackOnReturn = await createDummyFeedback(
        undefined,
        guide,
        otherUserReturn
      );

      const guides = await getGuides(userC._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForFeedback;
      const expected = expect.arrayContaining([
        {
          ...otherUserReturn2.toObject(),
          associatedReviewCount: 0,
        },
      ]);

      expect(actual).toEqual(expected);
    });

    it("ignores returns the user has already given feedback on", async () => {
      const userD = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(userD, guide);
      const otherUserReturn = await createDummyReturn(undefined, guide);

      const feedbackGiven = await createDummyFeedbackWithReturn(
        userD,
        guide,
        otherUserReturn
      );

      const guides = await getGuides(userD._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForFeedback;
      const expected = [] as ReturnDocument[];

      expect(actual).toEqual(expected);
    });
  });

  describe("feedbackGiven", () => {
    afterEach(async () => await clearDatabase());

    it("returns feedback given by the user", async () => {
      const userE = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(userE, guide);

      const feedbackGiven = await createDummyFeedbackWithReturn(
        userE,
        guide,
        userReturn
      );

      const feedbackGiven2 = await createDummyFeedbackWithReturn(
        userE,
        guide,
        userReturn
      );

      const feedbackGivenOnOtherGuide = await createDummyFeedbackWithReturn(
        userE,
        undefined,
        userReturn
      );
      const feedbackGivenByOtherUser = await createDummyFeedbackWithReturn(
        undefined,
        guide,
        userReturn
      );

      const guides = await getGuides(userE._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");
      const actual = gottenGuide.feedbackGiven;
      const expected = [feedbackGiven, feedbackGiven2];

      expect(actual).toEqual(expected);
    });
  });

  describe("gradesGiven", () => {
    afterEach(async () => await clearDatabase());

    it("returns feedback where the user has given a grade", async () => {
      const userF = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(userF, guide);
      const otherUsersReturn = await createDummyReturn(undefined, guide);

      const gradeGiven = await createDummyGrade(undefined, guide, userReturn);
      const gradeGiven2 = await createDummyGrade(undefined, guide, userReturn);
      const gradesReceived = await createDummyGrade(userF, guide, undefined);
      const otherUsersGradeReceived = await createDummyGrade(
        undefined,
        guide,
        otherUsersReturn
      );

      const guides = await getGuides(userF._id.toString());

      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.gradesGiven;
      const expected = expect.arrayContaining([gradeGiven, gradeGiven2]);

      expect(actual).toEqual(expected);
    });
  });

  describe("gradesReceived", () => {
    afterEach(async () => await clearDatabase());

    it("returns feedback given by user that has a grade", async () => {
      const user = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(user, guide);

      const feedbackReceived = await createDummyFeedback(
        undefined,
        guide,
        userReturn
      );

      const feedbackGiven = await createDummyFeedback(user, guide, undefined);

      const grade = await createDummyGrade(user, guide, undefined);
      const grade2 = await createDummyGrade(user, guide, undefined);
      const otherGrade = await createDummyGrade(undefined, guide, undefined);

      const guides = await getGuides(user._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.gradesReceived).toEqual([
        expect.objectContaining(grade),
        expect.objectContaining(grade2),
      ]);
    });
  });

  describe("feedbackReceived", () => {
    afterEach(async () => await clearDatabase());

    it("returns feedback that the user has received in order, starting with most recent", async () => {
      const userG = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(userG, guide);

      const feedback = await createDummyFeedbackWithReturn(
        undefined,
        guide,
        userReturn
      );
      const otherFeedback = await createDummyFeedbackWithReturn(
        undefined,
        guide,
        undefined
      );
      const feedback2 = await createDummyFeedbackWithReturn(
        undefined,
        guide,
        userReturn
      );

      const guides = await getGuides(userG._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.feedbackReceived).toEqual([feedback2, feedback]);
    });
  });

  describe("returnsSubmitted", () => {
    afterEach(async () => await clearDatabase());

    it("returns guide returns that the user has submitted", async () => {
      const user = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(user, guide);
      const otherUserReturn = await createDummyReturn(undefined, guide);

      const guides = await getGuides(user._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.returnsSubmitted).toEqual([userReturn.toObject()]);
    });
    it("returns guides that the user has returned in order, starting with the most recent", async () => {
      const user = await createDummyUser();

      const guide = await createDummyGuide();

      const Return1 = await createDummyReturn(user, guide);
      const Return2 = await createDummyReturn(user, guide);

      const guides = await getGuides(user._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.returnsSubmitted).toEqual([
        Return1.toObject(),
        Return2.toObject(),
      ]);
    });
  });

  describe("availableToGrade", () => {
    it("returns all feedback that the user is able to grade", async () => {
      const user1 = await createDummyUser();
      const user2 = await createDummyUser();

      const guide = await createDummyGuide();
      const guide2 = await createDummyGuide();

      const userReturn = await createDummyReturn(user1, guide);

      const otherUserReturn = await createDummyReturn(undefined, guide);
      const otherUserReturn2 = await createDummyReturn(user2, guide);

      const feedbackReceived = await createDummyFeedbackWithReturn(
        undefined,
        guide,
        userReturn
      );
      const feedbackReceived2 = await createDummyFeedbackWithReturn(
        undefined,
        guide,
        userReturn
      );

      const feedbackReceivedByUser2 = await createDummyFeedbackWithReturn(
        user1,
        guide,
        otherUserReturn
      );

      const feedbackGiven = await createDummyFeedbackWithReturn(
        user1,
        guide,
        undefined
      );

      const gradeReceived = await createDummyGrade(
        undefined,
        guide,
        userReturn
      );
      const gradeReceived2 = await createDummyGrade(
        undefined,
        guide,
        userReturn
      );
      const gradeReceivedForOtherUser = await createDummyGrade(
        undefined,
        guide,
        otherUserReturn
      );

      const gradeReceivedByUser2 = await createDummyGrade(
        undefined,
        guide,
        otherUserReturn2
      );

      const guides = await getGuides(user1._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableToGrade;
      const expected = expect.arrayContaining([
        feedbackReceived,
        feedbackReceived2,
      ]);
      expect(actual).toEqual(expected);
    });
  });

  it("returns GuideInfo[]", async () => {
    const userH = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(userH, guide);

    const review = await createDummyGrade(userH, guide, userReturn);

    const guides = await getGuides(userH._id.toString());

    expect(guides).not.toBeNull();

    if (guides) {
      expect(isGuideInfo(guides[0])).toBe(true);
    }
  });

  it("returns empty array when there are no guides", async () => {
    const userI = await createDummyUser();

    const guides = await getGuides(userI._id.toString());

    expect(guides).not.toBeNull();
    expect(guides).toEqual([]);
  });
});
