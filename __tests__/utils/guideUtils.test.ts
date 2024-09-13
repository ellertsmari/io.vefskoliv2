// utils.test.ts
import {
  FeedbackStatus,
  ReturnStatus,
  ReviewsGivenStatus,
  ReviewsReceivedStatus,
} from "../../app/guides/types";
import {
  calculateFeedbackStatus,
  calculateReturnStatus,
  calculateReviewGivenStatus,
  calculateReviewsReceivedStatus,
  calculateReviewScore,
} from "../../app/guides/utils";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyFeedback,
  createDummyGuide,
  createDummyReturn,
  createDummyReview,
  createDummyUser,
} from "../__mocks__/mongoHandler";

describe("status calculations", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  describe("calculateReturnStatus", () => {
    afterEach(async () => await clearDatabase());

    // it("should return NOT_RETURNED if no guides are returned", () => {
    //   const result = calculateReturnStatus([], []);
    //   expect(result).toBe(ReturnStatus.NOT_RETURNED);
    // });

    // it("should return AWAITING_FEEDBACK if a guide is returned but no feedback is given on that guide", async () => {
    //   const guide1 = await createDummyGuide();

    //   const user = await createDummyUser();

    //   const return1 = await createDummyReturn(user, guide1);
    //   const return2 = await createDummyReturn(user, guide1);

    //   const feedbackGuide1 = await createDummyFeedback(
    //     undefined,
    //     guide1,
    //     return1
    //   );
    //   const feedbackGuide2 = await createDummyFeedback(
    //     undefined,
    //     guide1,
    //     return1
    //   );

    //   expect(
    //     calculateReturnStatus(
    //       [return1, return2],
    //       [feedbackGuide1, feedbackGuide2]
    //     )
    //   ).toBe(ReturnStatus.AWAITING_FEEDBACK);
    // });

    it("should return AWAITING_FEEDBACK if a guide is returned and 1 'no pas'  feedback is given on that guide ", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);

      const feedbackGuide1 = await createDummyFeedback(
        undefined,
        guide1,
        return1,
        true
      );

      expect(calculateReturnStatus([return1], [feedbackGuide1])).toBe(
        ReturnStatus.AWAITING_FEEDBACK
      );
    });

    it("should return FAILED if a guide is returned and 2 'no pass'  feedback is given on that guide ", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);

      const feedbackGuide1 = await createDummyFeedback(
        undefined,
        guide1,
        return1,
        true
      );

      const feedbackGuide2 = await createDummyFeedback(
        undefined,
        guide1,
        return1,
        true
      );

      expect(
        calculateReturnStatus([return1], [feedbackGuide1, feedbackGuide2])
      ).toBe(ReturnStatus.FAILED);
    });

    // it("should return PASSED if a guide is returned and at least 2 feedback is given on that guide and the feedback is 'pass'", async () => {
    //   const guide1 = await createDummyGuide();

    //   const user = await createDummyUser();

    //   const return1 = await createDummyReturn(user, guide1);

    //   const feedbackGuide1 = await createDummyFeedback(
    //     undefined,
    //     guide1,
    //     return1,
    //     false
    //   );
    //   const feedbackGuide2 = await createDummyFeedback(
    //     undefined,
    //     guide1,
    //     return1,
    //     false
    //   );
    //   expect(
    //     calculateReturnStatus([return1], [feedbackGuide1, feedbackGuide2])
    //   ).toBe(ReturnStatus.PASSED);
    // });
  });

  describe("calculateFeedbackStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_PROJECTS if no feedback is given and no projects are available", () => {
      const result = calculateFeedbackStatus([], []);
      expect(result).toBe(FeedbackStatus.AWAITING_PROJECTS);
    });

    it("should return NEED_TO_PROVIDE_FEEDBACK if less than 2 feedbacks are given and projects are available", async () => {
      const feedback1 = await createDummyFeedback();
      const return1 = await createDummyReturn();

      const result = calculateFeedbackStatus([feedback1], [return1]);
      expect(result).toBe(FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK);
    });

    it("should return FEEDBACK_GIVEN if at least 2 feedbacks are given", async () => {
      const feedback1 = await createDummyFeedback();
      const feedback2 = await createDummyFeedback();
      const return1 = await createDummyReturn();

      const result = calculateFeedbackStatus([feedback1, feedback2], [return1]);
      expect(result).toBe(FeedbackStatus.FEEDBACK_GIVEN);
    });
  });

  describe("calculateReviewsReceivedStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_REVIEWS if less than 2 reviews are received", async () => {
      const review1 = await createDummyReview();

      const result = calculateReviewsReceivedStatus([review1]);

      expect(result).toBe(ReviewsReceivedStatus.AWAITING_REVIEWS);
    });

    it("should return REVIEWS_RECEIVED if at least 2 reviews are received", async () => {
      const review1 = await createDummyReview();

      const review2 = await createDummyReview();

      const result = calculateReviewsReceivedStatus([review1, review2]);
      expect(result).toBe(ReviewsReceivedStatus.GRADES_RECEIVED);
    });
  });

  describe("calculateReviewScore", () => {
    afterEach(async () => await clearDatabase());

    it("should return undefined if no reviews are received", async () => {
      const result = calculateReviewScore([]);
      expect(result).toBeUndefined();
    });

    it("should return undefined if 1 review is received", async () => {
      const review1 = await createDummyReview();
      const result = calculateReviewScore([review1]);
      expect(result).toBeUndefined();
    });

    it("should return the average of the two highest reviews", async () => {
      const review1 = await createDummyReview(
        undefined,
        undefined,
        undefined,
        undefined,
        5
      );
      const review2 = await createDummyReview(
        undefined,
        undefined,
        undefined,
        undefined,
        9
      );
      const review3 = await createDummyReview(
        undefined,
        undefined,
        undefined,
        undefined,
        6
      );

      const result = calculateReviewScore([review1, review2, review3]);
      expect(result).toBe((review2.grade + review3.grade) / 2);
    });
  });

  describe("calculateReviewGivenStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_FEEDBACK if no reviews are given and no projects are available", async () => {
      const result = calculateReviewGivenStatus([], []);
      expect(result).toBe(ReviewsGivenStatus.AWAITING_FEEDBACK);
    });

    it("should return NEED_TO_REVIEW if no reviews are given and projects are available", async () => {
      const return1 = await createDummyReturn();
      const result = calculateReviewGivenStatus([], [return1]);
      expect(result).toBe(ReviewsGivenStatus.NEED_TO_REVIEW);
    });

    it("should return REVIEWS_GIVEN if at least 2 reviews are given", async () => {
      const review1 = await createDummyReview();
      const review2 = await createDummyReview();
      const return1 = await createDummyReturn();

      const result = calculateReviewGivenStatus([review1, review2], [return1]);
      expect(result).toBe(ReviewsGivenStatus.GRADES_GIVEN);
    });
  });
});
