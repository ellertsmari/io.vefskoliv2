/**
 * @jest-environment node
 */
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
import { ReturnDocument } from "models/return";
import { getGuides } from "serverActions/getGuides";
import { auth } from "../../auth";

// `getGuides` is a server action guarded by a session. The real `auth()` reads
// cookies, which throws outside a request scope, so every test signs in a
// caller. The caller is a TEACHER by default: only teachers may ask for another
// user's guides, and most tests here look up the user they just created. The
// "authorisation" block at the end covers students and the logged-out case.
jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

// for type checking (note: _id is serialized to string by getGuides)
function isGuideInfo(obj: any): obj is GuideInfo {
  return (
    Array.isArray(obj.returnsSubmitted) &&
    Array.isArray(obj.reviewsReceived) &&
    Array.isArray(obj.availableForReview) &&
    Array.isArray(obj.reviewsGiven) &&
    Array.isArray(obj.gradesReceived) &&
    Array.isArray(obj.gradesGiven) &&
    Array.isArray(obj.availableToGrade) &&
    typeof obj._id === "string" // After JSON serialization, _id is a string
  );
}

// Helper to find guide by ID (handles serialized ObjectIds)
function findGuideById(guides: any[] | null, guideId: Types.ObjectId) {
  return guides?.find((g) => g._id.toString() === guideId.toString());
}

// Helper to serialize Mongoose documents the same way getGuides does
function serialize<T>(doc: T): T {
  return JSON.parse(JSON.stringify(doc));
}

describe("getGuides", () => {
  beforeAll(async () => await connect());

  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: new Types.ObjectId().toString(), role: "teacher" },
    });
  });

  afterEach(async () => await clearDatabase());

  afterAll(async () => await closeDatabase());

  describe("availableForReview", () => {
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

      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForReview;
      const expected = expect.arrayContaining([
        {
          ...serialize(otherUserReturn.toObject()),
          associatedReviewCount: 0,
        },
        {
          ...serialize(otherUserReturn2.toObject()),
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForReview;
      const expected = [
        { ...serialize(aReturn.toObject()), associatedReviewCount: 1 },
        { ...serialize(anotherReturn.toObject()), associatedReviewCount: 2 },
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForReview;
      const expected = expect.arrayContaining([
        {
          ...serialize(otherUserReturn2.toObject()),
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableForReview;
      const expected = [] as ReturnDocument[];

      expect(actual).toEqual(expected);
    });
  });

  describe("reviewsGiven", () => {
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");
      const actual = gottenGuide.reviewsGiven;
      const expected = [serialize(feedbackGiven), serialize(feedbackGiven2)];

      expect(actual).toEqual(expected);
    });
  });

  describe("gradesGiven", () => {
    afterEach(async () => await clearDatabase());

    // Grading is teacher-only, and a grade records its grader in `gradedBy` —
    // that field, not the review's owner, is what puts a review in this list.
    it("returns the reviews this user graded", async () => {
      const teacher = await createDummyUser("teacher");

      const guide = await createDummyGuide();

      const aReturn = await createDummyReturn(undefined, guide);

      const graded = await createDummyGrade(
        undefined,
        guide,
        aReturn,
        undefined,
        teacher
      );
      const graded2 = await createDummyGrade(
        undefined,
        guide,
        aReturn,
        undefined,
        teacher
      );
      // Graded by somebody else, and an ungraded review: neither counts.
      await createDummyGrade(undefined, guide, aReturn);
      await createDummyFeedback(undefined, guide, aReturn);

      const guides = await getGuides(teacher._id.toString());

      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      // Compared by id: `gradesGiven` doesn't join the return back in, so the
      // documents don't carry the `associatedReturn` the helper attaches.
      const actual = gottenGuide.gradesGiven.map((review: any) =>
        String(review._id)
      );

      expect(actual).toEqual(
        expect.arrayContaining([String(graded._id), String(graded2._id)])
      );
      expect(actual).toHaveLength(2);
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.gradesReceived).toEqual([
        expect.objectContaining(serialize(grade)),
        expect.objectContaining(serialize(grade2)),
      ]);
    });
  });

  describe("reviewsReceived", () => {
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.reviewsReceived).toEqual([serialize(feedback2), serialize(feedback)]);
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
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.returnsSubmitted).toEqual([serialize(userReturn.toObject())]);
    });
    it("returns guides that the user has returned in order, starting with the most recent", async () => {
      const user = await createDummyUser();

      const guide = await createDummyGuide();

      const Return1 = await createDummyReturn(user, guide);
      const Return2 = await createDummyReturn(user, guide);

      const guides = await getGuides(user._id.toString());
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      expect(gottenGuide.returnsSubmitted).toEqual([
        serialize(Return1.toObject()),
        serialize(Return2.toObject()),
      ]);
    });
  });

  describe("availableToGrade", () => {
    it("returns all feedback that the user is able to grade", async () => {
      const user1 = await createDummyUser();
      const user2 = await createDummyUser();
      const user3 = await createDummyUser();

      const guide = await createDummyGuide();

      // User1's own return - feedback on this should NOT be available to grade by user1
      const userReturn = await createDummyReturn(user1, guide);

      // Other users' returns - feedback on these SHOULD be available to grade by user1
      const otherUserReturn = await createDummyReturn(user2, guide);
      const otherUserReturn2 = await createDummyReturn(user3, guide);

      // Feedback on other users' returns (not owned by user1) - should be available to grade
      const feedbackOnOtherReturn = await createDummyFeedbackWithReturn(
        user2, // owner of feedback
        guide,
        otherUserReturn // return owned by user2
      );
      const feedbackOnOtherReturn2 = await createDummyFeedbackWithReturn(
        user3, // owner of feedback
        guide,
        otherUserReturn2 // return owned by user3
      );

      // Feedback by user1 - should NOT be available (can't grade own feedback)
      const feedbackByUser1 = await createDummyFeedbackWithReturn(
        user1,
        guide,
        otherUserReturn
      );

      // Graded feedback - should NOT be available (already graded)
      const gradedFeedback = await createDummyGrade(
        user2,
        guide,
        otherUserReturn
      );

      const guides = await getGuides(user1._id.toString());
      const gottenGuide = findGuideById(guides, guide._id);

      if (!gottenGuide) throw new Error("gottenGuide is null");

      const actual = gottenGuide.availableToGrade;
      // Should contain feedbackOnOtherReturn and feedbackOnOtherReturn2
      // (ungraded feedback on returns not owned by user1, not created by user1)
      const expected = expect.arrayContaining([
        serialize(feedbackOnOtherReturn),
        serialize(feedbackOnOtherReturn2),
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

  it("returns nothing to a caller who is not logged in", async () => {
    const userJ = await createDummyUser();
    const guide = await createDummyGuide();
    await createDummyReturn(userJ, guide);
    (auth as jest.Mock).mockResolvedValue(null);

    expect(await getGuides(userJ._id.toString())).toBeNull();
  });

  describe("authorisation", () => {
    it("gives a student their own guides even when they ask for someone else's", async () => {
      const student = await createDummyUser();
      const classmate = await createDummyUser();
      const guide = await createDummyGuide();
      const classmateReturn = await createDummyReturn(classmate, guide);
      const ownReturn = await createDummyReturn(student, guide);
      (auth as jest.Mock).mockResolvedValue({
        user: { id: student._id.toString(), role: "user" },
      });

      const guides = await getGuides(classmate._id.toString());
      const info = findGuideById(guides, guide._id);

      expect(info?.returnsSubmitted.map((r: any) => r._id)).toEqual([
        ownReturn._id.toString(),
      ]);
      expect(info?.availableForReview.map((r: any) => r._id)).toEqual([
        classmateReturn._id.toString(),
      ]);
    });

    it("gives a student their own guides when they pass no id", async () => {
      const student = await createDummyUser();
      const guide = await createDummyGuide();
      const ownReturn = await createDummyReturn(student, guide);
      (auth as jest.Mock).mockResolvedValue({
        user: { id: student._id.toString(), role: "user" },
      });

      const info = findGuideById(await getGuides(), guide._id);

      expect(info?.returnsSubmitted.map((r: any) => r._id)).toEqual([
        ownReturn._id.toString(),
      ]);
    });

    it("lets a teacher look up any student's guides", async () => {
      const student = await createDummyUser();
      const guide = await createDummyGuide();
      const studentReturn = await createDummyReturn(student, guide);
      const teacher = await createDummyUser("teacher");
      (auth as jest.Mock).mockResolvedValue({
        user: { id: teacher._id.toString(), role: "teacher" },
      });

      const info = findGuideById(
        await getGuides(student._id.toString()),
        guide._id
      );

      expect(info?.returnsSubmitted.map((r: any) => r._id)).toEqual([
        studentReturn._id.toString(),
      ]);
    });

    it("keeps working for a teacher who is aliased as a student", async () => {
      const student = await createDummyUser();
      const guide = await createDummyGuide();
      const studentReturn = await createDummyReturn(student, guide);
      const other = await createDummyUser();
      // While aliased, session.user IS the student; the original role is what
      // grants the lookup.
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: other._id.toString(),
          role: "user",
          isAliased: true,
          originalUser: { id: "t", role: "teacher" },
        },
      });

      const info = findGuideById(
        await getGuides(student._id.toString()),
        guide._id
      );

      expect(info?.returnsSubmitted.map((r: any) => r._id)).toEqual([
        studentReturn._id.toString(),
      ]);
    });
  });
});
