// utils.test.ts
import {
  ReviewStatus,
  ReturnStatus,
  GradesGivenStatus,
  GradesReceivedStatus,
} from "types/guideTypes";
import {
  calculateReviewStatus,
  calculateReturnStatus,
  calculateGradesGivenStatus,
  calculateGradesReceivedStatus,
  calculateGrade,
  hasExceededReviewGracePeriod,
  isGradingMonth,
  extendGuides,
} from "utils/guideUtils";
import { REVIEW_GRACE_PERIOD_DAYS } from "constants/peerReview";
import { ReturnDocument } from "models/return";
import { GuideInfo } from "types/guideTypes";
import { Types } from "mongoose";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyReview,
  createDummyGuide,
  createDummyReturn,
  createDummyGrade,
  createDummyUser,
} from "../__mocks__/mongoHandler";

describe("status calculations", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  describe("calculateReturnStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return NOT_RETURNED if no guides are returned", () => {
      const result = calculateReturnStatus([], []);
      expect(result).toBe(ReturnStatus.NOT_RETURNED);
    });

    it("should return AWAITING_REVIEWS if a guide is returned but no review is given on that guide", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);
      const return2 = await createDummyReturn(user, guide1);

      const reviewGuide1 = await createDummyReview(
        undefined,
        guide1,
        return1
      );
      const reviewGuide2 = await createDummyReview(
        undefined,
        guide1,
        return1
      );

      expect(
        calculateReturnStatus(
          [return1, return2],
          [reviewGuide1, reviewGuide2]
        )
      ).toBe(ReturnStatus.AWAITING_REVIEWS);
    });

    it("should return AWAITING_REVIEWS if a guide is returned and 1 'no pass' review is given on that guide ", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);

      const reviewGuide1 = await createDummyReview(
        undefined,
        guide1,
        return1,
        true
      );

      expect(calculateReturnStatus([return1], [reviewGuide1])).toBe(
        ReturnStatus.AWAITING_REVIEWS
      );
    });

    it("should return FAILED if a guide is returned and 2 'no pass' reviews are given on that guide ", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);

      const reviewGuide1 = await createDummyReview(
        undefined,
        guide1,
        return1,
        true
      );

      const reviewGuide2 = await createDummyReview(
        undefined,
        guide1,
        return1,
        true
      );

      expect(
        calculateReturnStatus([return1], [reviewGuide1, reviewGuide2])
      ).toBe(ReturnStatus.FAILED);
    });

    it("should return PASSED if a guide is returned and at least 2 reviews are given on that guide and the reviews are 'pass'", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);

      const reviewGuide1 = await createDummyReview(
        undefined,
        guide1,
        return1,
        false
      );
      const reviewGuide2 = await createDummyReview(
        undefined,
        guide1,
        return1,
        false
      );
      expect(
        calculateReturnStatus([return1], [reviewGuide1, reviewGuide2])
      ).toBe(ReturnStatus.PASSED);
    });
  });

  describe("calculateReviewStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_PROJECTS if no reviews are given and no projects are available", () => {
      const result = calculateReviewStatus([], []);
      expect(result).toBe(ReviewStatus.AWAITING_PROJECTS);
    });

    it("should return NEED_TO_REVIEW if less than 2 reviews are given and projects are available", async () => {
      const review1 = await createDummyReview();
      const return1 = await createDummyReturn();

      const result = calculateReviewStatus([review1], [return1]);
      expect(result).toBe(ReviewStatus.NEED_TO_REVIEW);
    });

    it("should return REVIEWS_GIVEN if at least 2 reviews are given", async () => {
      const review1 = await createDummyReview();
      const review2 = await createDummyReview();
      const return1 = await createDummyReturn();

      const result = calculateReviewStatus(
        [review1, review2],
        [return1]
      );
      expect(result).toBe(ReviewStatus.REVIEWS_GIVEN);
    });
  });

  describe("calculateGradesReceivedStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_GRADES if less than 2 reviews are received", async () => {
      const review1 = await createDummyGrade();

      const result = calculateGradesReceivedStatus([review1]);

      expect(result).toBe(GradesReceivedStatus.AWAITING_GRADES);
    });

    it("should return REVIEWS_RECEIVED if at least 2 reviews are received", async () => {
      const review1 = await createDummyGrade();

      const review2 = await createDummyGrade();

      const result = calculateGradesReceivedStatus([review1, review2]);
      expect(result).toBe(GradesReceivedStatus.GRADES_RECEIVED);
    });
  });

  describe("calculateGrade", () => {
    afterEach(async () => await clearDatabase());

    it("should return undefined if guide not returned", () => {
      const result = calculateGrade([], ReturnStatus.NOT_RETURNED);
      expect(result).toBeUndefined();
    });

    it("should return undefined if guide failed", () => {
      const result = calculateGrade([], ReturnStatus.FAILED);
      expect(result).toBeUndefined();
    });

    it("should return 5 if guide returned but no graded reviews yet", () => {
      const result = calculateGrade([], ReturnStatus.PASSED);
      expect(result).toBe(5);
    });

    it("should return 5 if guide awaiting reviews", () => {
      const result = calculateGrade([], ReturnStatus.AWAITING_REVIEWS);
      expect(result).toBe(5);
    });

    it("should return 5 points for return + scaled review grade when enough reviews", async () => {
      const review1 = await createDummyGrade(
        undefined,
        undefined,
        undefined,
        5
      );
      const review2 = await createDummyGrade(
        undefined,
        undefined,
        undefined,
        9
      );
      const review3 = await createDummyGrade(
        undefined,
        undefined,
        undefined,
        6
      );

      const result = calculateGrade([review1, review2, review3], ReturnStatus.PASSED);
      // Two highest grades are 9 and 6, average is 7.5
      // New formula: 5 (return points) + (7.5 / 10 * 5) = 5 + 3.75 = 8.75
      const reviewAverage = (review2.grade + review3.grade) / 2;
      const expected = Math.round((5 + (reviewAverage / 10) * 5) * 10) / 10;
      expect(result).toBe(expected);
    });

    it("should ignore a single graded review by default (still waiting for the second)", async () => {
      const review = await createDummyGrade(undefined, undefined, undefined, 8);
      // gradePartialReviews defaults to false -> not enough graded reviews yet.
      const result = calculateGrade([review], ReturnStatus.AWAITING_REVIEWS);
      expect(result).toBe(5);
    });

    it("should count a single graded review once partial reviews are allowed", async () => {
      const review = await createDummyGrade(undefined, undefined, undefined, 8);
      // gradePartialReviews = true (student stuck past the grace period).
      const result = calculateGrade(
        [review],
        ReturnStatus.AWAITING_REVIEWS,
        true
      );
      // 5 (return) + (8 / 10 * 5) = 5 + 4 = 9 — the single grade is NOT halved.
      expect(result).toBe(9);
    });
  });

  describe("hasExceededReviewGracePeriod", () => {
    afterEach(async () => await clearDatabase());

    const daysAgo = (days: number): ReturnDocument =>
      ({ createdAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000) }) as ReturnDocument;

    it("is false when the student has not returned the guide", () => {
      expect(hasExceededReviewGracePeriod([])).toBe(false);
    });

    it("is false within the grace period", () => {
      const result = hasExceededReviewGracePeriod([
        daysAgo(REVIEW_GRACE_PERIOD_DAYS - 1),
      ]);
      expect(result).toBe(false);
    });

    it("is true once the grace period has passed", () => {
      const result = hasExceededReviewGracePeriod([
        daysAgo(REVIEW_GRACE_PERIOD_DAYS + 1),
      ]);
      expect(result).toBe(true);
    });

    it("uses the earliest return so a resubmission doesn't reset the clock", () => {
      const result = hasExceededReviewGracePeriod([
        daysAgo(1),
        daysAgo(REVIEW_GRACE_PERIOD_DAYS + 5),
      ]);
      expect(result).toBe(true);
    });
  });

  describe("isGradingMonth", () => {
    afterEach(async () => await clearDatabase());

    it("is true in May, August, and December", () => {
      expect(isGradingMonth(new Date("2026-05-15T12:00:00Z"))).toBe(true);
      expect(isGradingMonth(new Date("2026-08-15T12:00:00Z"))).toBe(true);
      expect(isGradingMonth(new Date("2026-12-15T12:00:00Z"))).toBe(true);
    });

    it("is false in non-grading months", () => {
      expect(isGradingMonth(new Date("2026-01-15T12:00:00Z"))).toBe(false);
      expect(isGradingMonth(new Date("2026-06-15T12:00:00Z"))).toBe(false);
      expect(isGradingMonth(new Date("2026-11-15T12:00:00Z"))).toBe(false);
    });
  });

  // End-to-end behavior of the "soft floor": after the grace period the student
  // is graded on whatever reviews they gave, and a late-arriving project cannot
  // drop that earned grade — it's only surfaced as an optional nudge.
  // A fixed non-grading-month `now` is passed so these tests are deterministic
  // regardless of when they run (grading months are covered separately below).
  describe("extendGuides soft-floor grading", () => {
    afterEach(async () => await clearDatabase());

    const NOW = new Date("2026-06-15T12:00:00Z"); // June — not a grading month

    const returnAgedDays = (days: number) =>
      ({
        _id: new Types.ObjectId(),
        createdAt: new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000),
      }) as ReturnDocument;

    const guideWith = (overrides: Partial<GuideInfo>): GuideInfo =>
      ({
        _id: new Types.ObjectId(),
        title: "Test guide",
        description: "",
        category: "code",
        order: 0,
        module: { title: "3 - Test" },
        returnsSubmitted: [],
        reviewsReceived: [],
        availableForReview: [],
        reviewsGiven: [],
        gradesReceived: [],
        gradesGiven: [],
        availableToGrade: [],
        ...overrides,
      }) as unknown as GuideInfo;

    it("does NOT count a single review within the grace period (still must review)", () => {
      const guide = guideWith({
        returnsSubmitted: [returnAgedDays(REVIEW_GRACE_PERIOD_DAYS - 3)],
        reviewsGiven: [{} as never],
        gradesReceived: [{ grade: 8 } as never],
        availableForReview: [returnAgedDays(1)], // a project is available
      });

      const [extended] = extendGuides([guide], NOW);

      // Inside the window: a single review doesn't count and the available
      // project must still be reviewed.
      expect(extended.reviewStatus).toBe(ReviewStatus.NEED_TO_REVIEW);
      expect(extended.grade).toBe(5);
    });

    it("grades the one review (9) once past the grace period with nothing to review", () => {
      const guide = guideWith({
        returnsSubmitted: [returnAgedDays(REVIEW_GRACE_PERIOD_DAYS + 5)],
        reviewsGiven: [{} as never],
        gradesReceived: [{ grade: 8 } as never],
        availableForReview: [], // nothing available to review
      });

      const [extended] = extendGuides([guide], NOW);

      expect(extended.reviewStatus).toBe(ReviewStatus.AWAITING_PROJECTS);
      expect(extended.grade).toBe(9);
    });

    it("keeps the earned grade (9) when a late project appears past the grace period", () => {
      const guide = guideWith({
        returnsSubmitted: [returnAgedDays(REVIEW_GRACE_PERIOD_DAYS + 5)],
        reviewsGiven: [{} as never],
        gradesReceived: [{ grade: 8 } as never],
        availableForReview: [returnAgedDays(1)], // a late project showed up
      });

      const [extended] = extendGuides([guide], NOW);

      // Soft floor: the grade is NOT dragged back to 5. The late project is
      // still surfaced as an optional review (the nudge), but it can't lower
      // an already-earned grade.
      expect(extended.reviewStatus).toBe(ReviewStatus.NEED_TO_REVIEW);
      expect(extended.grade).toBe(9);
    });
  });

  // During grading months (May/Aug/Dec) the grace period is waived: a single
  // graded review counts immediately, even within the 14-day window and even if
  // a project is still available to review.
  describe("extendGuides grading-month waiver", () => {
    afterEach(async () => await clearDatabase());

    const GRADING_NOW = new Date("2026-05-15T12:00:00Z"); // May — a grading month

    const returnAgedDays = (days: number) =>
      ({
        _id: new Types.ObjectId(),
        createdAt: new Date(GRADING_NOW.getTime() - days * 24 * 60 * 60 * 1000),
      }) as ReturnDocument;

    const guideWith = (overrides: Partial<GuideInfo>): GuideInfo =>
      ({
        _id: new Types.ObjectId(),
        title: "Test guide",
        description: "",
        category: "code",
        order: 0,
        module: { title: "3 - Test" },
        returnsSubmitted: [],
        reviewsReceived: [],
        availableForReview: [],
        reviewsGiven: [],
        gradesReceived: [],
        gradesGiven: [],
        availableToGrade: [],
        ...overrides,
      }) as unknown as GuideInfo;

    it("counts a single review immediately within the grace window (no waiting)", () => {
      const guide = guideWith({
        // Returned only 3 days ago — well within the 14-day grace — and a
        // project is still available. Outside a grading month this would be 5.
        returnsSubmitted: [returnAgedDays(REVIEW_GRACE_PERIOD_DAYS - 11)],
        reviewsGiven: [{} as never],
        gradesReceived: [{ grade: 8 } as never],
        availableForReview: [returnAgedDays(1)],
      });

      const [extended] = extendGuides([guide], GRADING_NOW);

      // Still nudged to review, but the grade already reflects the earned 8.
      expect(extended.reviewStatus).toBe(ReviewStatus.NEED_TO_REVIEW);
      expect(extended.grade).toBe(9);
    });
  });

  describe("calculateGradesGivenStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_REVIEWS if no grades are given and no reviews are available", () => {
      const result = calculateGradesGivenStatus([], []);
      expect(result).toBe(GradesGivenStatus.AWAITING_REVIEWS);
    });

    it("should return NEED_TO_GRADE if no grades are given and reviews are available", async () => {
      const review1 = await createDummyReview();
      const result = calculateGradesGivenStatus([], [review1]);
      expect(result).toBe(GradesGivenStatus.NEED_TO_GRADE);
    });

    it("should return GRADES_GIVEN if at least 2 grades are given even if reviews are available", async () => {
      const grade1 = await createDummyGrade();
      const grade2 = await createDummyGrade();
      const review1 = await createDummyReview();

      const result = calculateGradesGivenStatus(
        [grade1, grade2],
        [review1]
      );

      // Once 2 grades have been given, status is GRADES_GIVEN regardless of available reviews
      expect(result).toBe(GradesGivenStatus.GRADES_GIVEN);
    });
    it("should return GRADES_GIVEN if at least 2 grades are given", async () => {
      const grade1 = await createDummyGrade();
      const grade2 = await createDummyGrade();

      const result = calculateGradesGivenStatus([grade1, grade2], []);

      expect(result).toBe(GradesGivenStatus.GRADES_GIVEN);
    });
  });
});
