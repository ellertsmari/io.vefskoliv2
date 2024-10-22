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

  it("returns availableForFeedback", async () => {
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

    if (!guides) throw new Error("guides is null");

    expect(guides[0].availableForFeedback).toEqual([
      expect.objectContaining(otherUserReturn.toObject()),
      expect.objectContaining(otherUserReturn2.toObject()),
    ]);
  });

  it("returns feedbackGiven", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const feedbackGiven = await createDummyFeedback(user, guide, userReturn);
    const feedbackGiven2 = await createDummyFeedback(user, guide, userReturn);
    const feedbackGivenOnOtherGuide = await createDummyFeedback(
      user,
      undefined,
      userReturn
    );
    const feedbackGivenByOtherUser = await createDummyFeedback(
      undefined,
      guide,
      userReturn
    );

    const guides = await getGuides(user._id.toString());

    if (!guides) throw new Error("guides is null");

    expect(guides[0].feedbackGiven).toEqual([
      expect.objectContaining(feedbackGiven.toObject()),
      expect.objectContaining(feedbackGiven2.toObject()),
    ]);
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

    if (!guides) throw new Error("guides is null");

    expect(guides[0].gradesGiven).toEqual([
      expect.objectContaining(gradeGiven.toObject()),
      expect.objectContaining(gradeGiven2.toObject()),
    ]);
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
    if (!guides) throw new Error("guides is null");

    expect(guides[0].gradesReceived).toEqual([
      expect.objectContaining(grade.toObject()),
      expect.objectContaining(grade2.toObject()),
    ]);
  });

  it("returns feedbackReceived", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);

    const feedback = await createDummyFeedback(undefined, guide, userReturn);
    const feedback2 = await createDummyFeedback(undefined, guide, userReturn);
    const otherFeedback = await createDummyFeedback(
      undefined,
      guide,
      undefined
    );

    const guides = await getGuides(user._id.toString());

    if (!guides) throw new Error("guides is null");

    expect(guides[0].feedbackReceived).toEqual([
      expect.objectContaining(feedback.toObject()),
      expect.objectContaining(feedback2.toObject()),
    ]);
  });

  it("returns returnsSubmitted", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const otherUserReturn = await createDummyReturn(undefined, guide);

    const guides = await getGuides(user._id.toString());

    if (!guides) throw new Error("guides is null");

    expect(guides[0].returnsSubmitted).toEqual([
      expect.objectContaining(userReturn.toObject()),
    ]);
  });

  it("returns availableToGrade", async () => {
    const user = await createDummyUser();

    const guide = await createDummyGuide();

    const userReturn = await createDummyReturn(user, guide);
    const otherUserReturn = await createDummyReturn(undefined, guide);

    const feedbackReceived = await createDummyFeedback(
      undefined,
      guide,
      userReturn
    );
    const feedbackReceived2 = await createDummyFeedback(
      undefined,
      guide,
      userReturn
    );

    const feedbackGiven = await createDummyFeedback(user, guide, undefined);

    const gradeReceived = await createDummyGrade(undefined, guide, userReturn);
    const gradeReceived2 = await createDummyGrade(undefined, guide, userReturn);
    const gradeReceivedForOtherUser = await createDummyGrade(
      undefined,
      guide,
      otherUserReturn
    );

    const guides = await getGuides(user._id.toString());

    if (!guides) throw new Error("guides is null");

    expect(guides[0].availableToGrade).toEqual([
      expect.objectContaining(feedbackReceived.toObject()),
      expect.objectContaining(feedbackReceived2.toObject()),
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
});
