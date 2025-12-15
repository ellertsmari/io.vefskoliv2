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
} from "utils/guideUtils";
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
