/**
 * @jest-environment node
 */
import { Types } from "mongoose";
import {
  ExtendedGuideInfo,
  GradesGivenStatus,
  GradesReceivedStatus,
  ReturnStatus,
  ReviewStatus,
} from "types/guideTypes";
import {
  resolveCanvasScore,
  scoresAreEquivalent,
} from "../../../app/lib/canvas/resolveScore";

const guideWith = (
  overrides: Partial<ExtendedGuideInfo>
): ExtendedGuideInfo =>
  ({
    _id: new Types.ObjectId(),
    title: "A guide",
    description: "",
    category: "code",
    order: 1,
    module: { title: "3 - Undirstöður", number: 3 },
    link: "/guides/1",
    returnsSubmitted: [],
    reviewsReceived: [],
    availableForReview: [],
    reviewsGiven: [],
    gradesReceived: [],
    gradesGiven: [],
    availableToGrade: [],
    returnStatus: ReturnStatus.NOT_RETURNED,
    reviewStatus: ReviewStatus.NEED_TO_REVIEW,
    gradesReceivedStatus: GradesReceivedStatus.AWAITING_GRADES,
    gradesGivenStatus: GradesGivenStatus.AWAITING_REVIEWS,
    grade: undefined,
    ...overrides,
  }) as ExtendedGuideInfo;

describe("resolveCanvasScore", () => {
  it("sends no score for work that has not been handed in", () => {
    // The distinction that matters: a blank Canvas cell, not a zero. Pushing 0
    // here would fail every student for work that is not yet due.
    const score = resolveCanvasScore(
      guideWith({ returnStatus: ReturnStatus.NOT_RETURNED, grade: undefined })
    );

    expect(score.scoreGiven).toBeUndefined();
    expect(score.gradingProgress).toBe("NotReady");
    expect(score.activityProgress).toBe("Initialized");
  });

  it("sends an explicit, final zero when peers failed the return", () => {
    const score = resolveCanvasScore(
      guideWith({ returnStatus: ReturnStatus.FAILED, grade: undefined })
    );

    expect(score.scoreGiven).toBe(0);
    expect(score.gradingProgress).toBe("FullyGraded");
  });

  it("keeps a failing auto-graded score instead of flattening it to zero", () => {
    // Auto-graded guides put the best attempt in `grade`, so a failed attempt
    // carries a real number. Overwriting it with 0 would lose the student's work.
    const score = resolveCanvasScore(
      guideWith({
        returnStatus: ReturnStatus.FAILED,
        gradesReceivedStatus: GradesReceivedStatus.NOT_APPLICABLE,
        grade: 4,
      })
    );

    expect(score.scoreGiven).toBe(4);
    expect(score.gradingProgress).toBe("FullyGraded");
  });

  it("marks an interim grade as provisional while review grades are missing", () => {
    const score = resolveCanvasScore(
      guideWith({
        returnStatus: ReturnStatus.AWAITING_REVIEWS,
        gradesReceivedStatus: GradesReceivedStatus.AWAITING_GRADES,
        grade: 5,
      })
    );

    expect(score.scoreGiven).toBe(5);
    expect(score.activityProgress).toBe("Submitted");
    expect(score.gradingProgress).toBe("PendingManual");
  });

  it("marks the grade final once the review grades have arrived", () => {
    const score = resolveCanvasScore(
      guideWith({
        returnStatus: ReturnStatus.PASSED,
        gradesReceivedStatus: GradesReceivedStatus.GRADES_RECEIVED,
        grade: 8.5,
      })
    );

    expect(score.scoreGiven).toBe(8.5);
    expect(score.activityProgress).toBe("Completed");
    expect(score.gradingProgress).toBe("FullyGraded");
  });

  it("treats hall of fame as a pass", () => {
    const score = resolveCanvasScore(
      guideWith({
        returnStatus: ReturnStatus.HALL_OF_FAME,
        gradesReceivedStatus: GradesReceivedStatus.GRADES_RECEIVED,
        grade: 10,
      })
    );

    expect(score.scoreGiven).toBe(10);
    expect(score.gradingProgress).toBe("FullyGraded");
  });

  it("scores auto-graded guides even though peer review never applies", () => {
    const score = resolveCanvasScore(
      guideWith({
        returnStatus: ReturnStatus.PASSED,
        gradesReceivedStatus: GradesReceivedStatus.NOT_APPLICABLE,
        grade: 9,
      })
    );

    expect(score.scoreGiven).toBe(9);
    expect(score.gradingProgress).toBe("FullyGraded");
  });

  it("always reports the 0..10 maximum the app already grades on", () => {
    expect(resolveCanvasScore(guideWith({})).scoreMaximum).toBe(10);
  });
});

describe("scoresAreEquivalent", () => {
  const passed = guideWith({
    returnStatus: ReturnStatus.PASSED,
    gradesReceivedStatus: GradesReceivedStatus.GRADES_RECEIVED,
    grade: 7,
  });

  it("suppresses a re-push when nothing changed", () => {
    expect(
      scoresAreEquivalent(resolveCanvasScore(passed), resolveCanvasScore(passed))
    ).toBe(true);
  });

  it("does not confuse a missing score with a zero", () => {
    // Both have no usable number, but one is "not handed in" and the other is a
    // failure. Treating them as equal would suppress the push that records it.
    const notReturned = resolveCanvasScore(
      guideWith({ returnStatus: ReturnStatus.NOT_RETURNED })
    );
    const failed = resolveCanvasScore(
      guideWith({ returnStatus: ReturnStatus.FAILED })
    );

    expect(scoresAreEquivalent(notReturned, failed)).toBe(false);
  });

  it("detects a grade becoming final at the same number", () => {
    const provisional = resolveCanvasScore(
      guideWith({
        returnStatus: ReturnStatus.PASSED,
        gradesReceivedStatus: GradesReceivedStatus.AWAITING_GRADES,
        grade: 7,
      })
    );

    expect(scoresAreEquivalent(provisional, resolveCanvasScore(passed))).toBe(
      false
    );
  });
});
