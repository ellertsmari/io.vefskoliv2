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

  // TODO
  describe("availableForFeedback", () => {
    it("returns otherUsersReturns", async () => {
      // only shows the latest return from each user

      const user = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(user, guide);
      const otherUserReturn = await createDummyReturn(undefined, guide);
      const otherUserReturn2 = await createDummyReturn(undefined, guide);

      const feedbackOnReturn = await createDummyFeedback(
        undefined,
        guide,
        userReturn
      );

      const guides = await getGuides(user._id.toString());

      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.availableForFeedback).toEqual([
        otherUserReturn.toObject(),
        otherUserReturn2.toObject(),
      ]);
    });
  });

  describe("waitingForFeedback", () => {
    afterEach(async () => await clearDatabase());
    it("only contains returns which have had less than two pieces of feedback", async () => {
      const user = await createDummyUser();
      const user2 = await createDummyUser();

      const guide = await createDummyGuide();

      const aReturn = await createDummyReturn(undefined, guide);
      const anotherReturn1 = await createDummyReturn(user2, guide);
      const anotherReturn2 = await createDummyReturn(user2, guide);

      const feedbackOnAnotherReturn = await createDummyFeedback(
        undefined,
        guide,
        anotherReturn2
      );

      const feedbackOnAnotherReturn2 = await createDummyFeedback(
        undefined,
        guide,
        anotherReturn2
      );

      const feedbackOnAReturn = await createDummyFeedback(
        undefined,
        guide,
        aReturn
      );

      const guides = await getGuides(user._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.waitingForFeedback).toEqual([aReturn.toObject()]);
    });

    it("only contains the latest return from a user", async () => {
      const userA = await createDummyUser();
      const otherUserA = await createDummyUser();

      const guide = await createDummyGuide();

      const otherUserReturn = await createDummyReturn(otherUserA, guide);
      const otherUserReturn2 = await createDummyReturn(otherUserA, guide);

      const feedbackOnReturn = await createDummyFeedback(
        undefined,
        guide,
        otherUserReturn
      );

      const guides = await getGuides(userA._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.waitingForFeedback).toEqual([
        otherUserReturn2.toObject(),
      ]);
    });

    it("ignores returns the user has already given feedback on", async () => {
      const user = await createDummyUser();

      const guide = await createDummyGuide();

      const userReturn = await createDummyReturn(user, guide);
      const otherUserReturn = await createDummyReturn(undefined, guide);

      const feedbackGiven = await createDummyFeedbackWithReturn(
        user,
        guide,
        otherUserReturn
      );

      const guides = await getGuides(user._id.toString());
      const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.waitingForFeedback).toEqual([]);
    });
  });

  it("returns feedbackGiven", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const feedbackGiven = await createDummyFeedbackWithReturn(
      user,
      guide,
      userReturn
    );

    const feedbackGiven2 = await createDummyFeedbackWithReturn(
      user,
      guide,
      userReturn
    );

    const feedbackGivenOnOtherGuide = await createDummyFeedbackWithReturn(
      user,
      undefined,
      userReturn
    );
    const feedbackGivenByOtherUser = await createDummyFeedbackWithReturn(
      undefined,
      guide,
      userReturn
    );

    const guides = await getGuides(user._id.toString());
    const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

    if (!gottenGuide) throw new Error("gottenGuide is null");

    expect(gottenGuide.feedbackGiven).toEqual([feedbackGiven, feedbackGiven2]);
  });

  it("returns gradesGiven", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const otherUsersReturn = await createDummyReturn(undefined, guide);

    const gradeGiven = await createDummyGrade(undefined, guide, userReturn);
    const gradeGiven2 = await createDummyGrade(undefined, guide, userReturn);
    const gradesReceived = await createDummyGrade(user, guide, undefined);
    const otherUsersGradeReceived = await createDummyGrade(
      undefined,
      guide,
      otherUsersReturn
    );

    const guides = await getGuides(user._id.toString());

    const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

    if (!gottenGuide) throw new Error("gottenGuide is null");

    expect(gottenGuide.gradesGiven).toEqual([gradeGiven, gradeGiven2]);
  });

  it("returns gradesReceived", async () => {
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

  it("returns feedbackReceived", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const feedback = await createDummyFeedbackWithReturn(
      undefined,
      guide,
      userReturn
    );
    const feedback2 = await createDummyFeedbackWithReturn(
      undefined,
      guide,
      userReturn
    );
    const otherFeedback = await createDummyFeedbackWithReturn(
      undefined,
      guide,
      undefined
    );

    const guides = await getGuides(user._id.toString());
    const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

    if (!gottenGuide) throw new Error("gottenGuide is null");

    expect(gottenGuide.feedbackReceived).toEqual([feedback, feedback2]);
  });

  it("returns returnsSubmitted", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const otherUserReturn = await createDummyReturn(undefined, guide);

    const guides = await getGuides(user._id.toString());
    const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

    if (!gottenGuide) throw new Error("gottenGuide is null");

    expect(gottenGuide.returnsSubmitted).toEqual([userReturn.toObject()]);
  });

  it("returns availableToGrade", async () => {
    const user = await createDummyUser();
    const user2 = await createDummyUser();

    const guide = await createDummyGuide();
    const guide2 = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

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
      user,
      guide,
      otherUserReturn
    );

    const feedbackGiven = await createDummyFeedbackWithReturn(
      user,
      guide,
      undefined
    );

    const gradeReceived = await createDummyGrade(undefined, guide, userReturn);
    const gradeReceived2 = await createDummyGrade(undefined, guide, userReturn);
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

    const guides = await getGuides(user._id.toString());
    const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

    if (!gottenGuide) throw new Error("gottenGuide is null");

    expect(gottenGuide.availableToGrade).toEqual([
      feedbackReceived,
      feedbackReceived2,
    ]);
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

  it("returns all guide information together", async () => {
    const user = await createDummyUser();
    const user2 = await createDummyUser();
    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const otherUserReturn = await createDummyReturn(user2, guide);
    const otherUserReturn2 = await createDummyReturn(user2, guide);

    const feedbackGiven = await createDummyFeedbackWithReturn(
      user,
      guide,
      userReturn
    );
    const feedbackGiven2 = await createDummyFeedbackWithReturn(
      user,
      guide,
      userReturn
    );
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

    const feedbackGivenAndGraded = await createDummyGrade(
      user,
      guide,
      otherUserReturn
    );

    const feedbackGivenAndGradedByUser2 = await createDummyGrade(
      user2,
      guide,
      otherUserReturn
    );
    const feedbackGivenAndGraded2 = await createDummyGrade(
      user,
      guide,
      otherUserReturn2
    );
    const feedbackReceivedAndGraded = await createDummyGrade(
      undefined,
      guide,
      userReturn
    );
    const feedbackReceivedAndGraded2 = await createDummyGrade(
      undefined,
      guide,
      userReturn
    );

    const guides = await getGuides(user._id.toString());
    const gottenGuide = guides?.filter((g) => g._id.equals(guide._id))[0];

    if (!gottenGuide) throw new Error("gottenGuide is null");

    const expectedFeedbackGiven = [
      feedbackGiven,
      feedbackGiven2,
      feedbackGivenAndGraded,
      feedbackGivenAndGraded2,
    ];

    const expectedFeedbackReceived = [
      feedbackReceived,
      feedbackReceived2,
      feedbackReceivedAndGraded,
      feedbackReceivedAndGraded2,
    ];

    const expectedGradesGiven = [
      feedbackReceivedAndGraded,
      feedbackReceivedAndGraded2,
    ];

    const expectedGradesReceived = [
      feedbackGivenAndGraded,
      feedbackGivenAndGraded2,
    ];

    const expectedAvailableForFeedback: ReturnDocument[] = [];

    const expectedAvailableToGrade = [feedbackReceived, feedbackReceived2];

    const gottenGrades = await Review.find({
      owner: user._id,
      grade: { $exists: true },
    });

    expect(gottenGuide.returnsSubmitted).toEqual([userReturn.toObject()]);
    expect(gottenGuide.availableForFeedback).toEqual(
      expectedAvailableForFeedback
    );
    expect(gottenGuide.feedbackGiven).toEqual(expectedFeedbackGiven);
    expect(gottenGuide.feedbackReceived).toEqual(expectedFeedbackReceived);
    expect(gottenGuide.gradesGiven).toEqual(expectedGradesGiven);
    expect(gottenGuide.availableToGrade).toEqual(expectedAvailableToGrade);
    expect(gottenGuide.gradesReceived).toEqual(expectedGradesReceived);
  });
});
