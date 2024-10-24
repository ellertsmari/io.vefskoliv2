// utils.test.ts
import {
  FeedbackStatus,
  ReturnStatus,
  GradesGivenStatus,
  GradesReceivedStatus,
} from "../../app/guides/types";
import {
  calculateFeedbackStatus,
  calculateReturnStatus,
  calculateGradesGivenStatus,
  calculateGradesReceivedStatus,
  calculateGrade,
} from "../../app/guides/utils";
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

describe("status calculations", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  describe("calculateReturnStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return NOT_RETURNED if no guides are returned", async () => {
      const result = await calculateReturnStatus([], []);
      expect(result).toBe(ReturnStatus.NOT_RETURNED);
    });

    it("should return AWAITING_FEEDBACK if a guide is returned but no feedback is given on that guide", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);
      const return2 = await createDummyReturn(user, guide1);

      const feedbackGuide1 = await createDummyFeedback(
        undefined,
        guide1,
        return1
      );
      const feedbackGuide2 = await createDummyFeedback(
        undefined,
        guide1,
        return1
      );

      expect(
        await calculateReturnStatus(
          [return1, return2],
          [feedbackGuide1, feedbackGuide2]
        )
      ).toBe(ReturnStatus.AWAITING_FEEDBACK);
    });

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

      expect(await calculateReturnStatus([return1], [feedbackGuide1])).toBe(
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
        await calculateReturnStatus([return1], [feedbackGuide1, feedbackGuide2])
      ).toBe(ReturnStatus.FAILED);
    });

    it("should return PASSED if a guide is returned and at least 2 feedback is given on that guide and the feedback is 'pass'", async () => {
      const guide1 = await createDummyGuide();

      const user = await createDummyUser();

      const return1 = await createDummyReturn(user, guide1);

      const feedbackGuide1 = await createDummyFeedback(
        undefined,
        guide1,
        return1,
        false
      );
      const feedbackGuide2 = await createDummyFeedback(
        undefined,
        guide1,
        return1,
        false
      );
      expect(
        await calculateReturnStatus([return1], [feedbackGuide1, feedbackGuide2])
      ).toBe(ReturnStatus.PASSED);
    });
  });

  describe("calculateFeedbackStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_PROJECTS if no feedback is given and no projects are available", async () => {
      const result = await calculateFeedbackStatus([], []);
      expect(result).toBe(FeedbackStatus.AWAITING_PROJECTS);
    });

    it("should return NEED_TO_PROVIDE_FEEDBACK if less than 2 feedbacks are given and projects are available", async () => {
      const feedback1 = await createDummyFeedback();
      const return1 = await createDummyReturn();

      const result = await calculateFeedbackStatus([feedback1], [return1]);
      expect(result).toBe(FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK);
    });

    it("should return FEEDBACK_GIVEN if at least 2 feedbacks are given", async () => {
      const feedback1 = await createDummyFeedback();
      const feedback2 = await createDummyFeedback();
      const return1 = await createDummyReturn();

      const result = await calculateFeedbackStatus(
        [feedback1, feedback2],
        [return1]
      );
      expect(result).toBe(FeedbackStatus.FEEDBACK_GIVEN);
    });
  });

  describe("calculateGradesReceivedStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_GRADES if less than 2 reviews are received", async () => {
      const review1 = await createDummyGrade();

      const result = await calculateGradesReceivedStatus([review1]);

      expect(result).toBe(GradesReceivedStatus.AWAITING_GRADES);
    });

    it("should return REVIEWS_RECEIVED if at least 2 reviews are received", async () => {
      const review1 = await createDummyGrade();

      const review2 = await createDummyGrade();

      const result = await calculateGradesReceivedStatus([review1, review2]);
      expect(result).toBe(GradesReceivedStatus.GRADES_RECEIVED);
    });
  });

  describe("calculateGrade", () => {
    afterEach(async () => await clearDatabase());

    it("should return undefined if no reviews are received", async () => {
      const result = await calculateGrade([]);
      expect(result).toBeUndefined();
    });

    it("should return undefined if 1 review is received", async () => {
      const review1 = await createDummyGrade();
      const result = await calculateGrade([review1]);
      expect(result).toBeUndefined();
    });

    it("should return the average of the two highest reviews", async () => {
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

      const result = await calculateGrade([review1, review2, review3]);
      expect(result).toBe((review2.grade + review3.grade) / 2);
    });
  });

  describe("calculateGradesGivenStatus", () => {
    afterEach(async () => await clearDatabase());

    it("should return AWAITING_FEEDBACK if no reviews are given and no projects are available", async () => {
      const result = await calculateGradesGivenStatus([], []);
      expect(result).toBe(GradesGivenStatus.AWAITING_FEEDBACK);
    });

    it("should return NEED_TO_GRADE if no reviews are given and projects are available", async () => {
      const return1 = await createDummyFeedback();
      const result = await calculateGradesGivenStatus([], [return1]);
      expect(result).toBe(GradesGivenStatus.NEED_TO_GRADE);
    });

    it("should return REVIEWS_GIVEN if at least 2 reviews are given", async () => {
      const review1 = await createDummyGrade();
      const review2 = await createDummyGrade();
      const return1 = await createDummyFeedback();

      const result = await calculateGradesGivenStatus(
        [review1, review2],
        [return1]
      );
      expect(result).toBe(GradesGivenStatus.GRADES_GIVEN);
    });
  });
});
