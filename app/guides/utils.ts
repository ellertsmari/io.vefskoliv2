"use server";
import { ReturnDocument } from "../models/return";
import {
  FeedbackDocument,
  GradedFeedbackDocument,
  Vote,
} from "../models/review";
import {
  ReturnStatus,
  FeedbackStatus,
  ReviewsReceivedStatus,
  ReviewsGivenStatus,
  ExtendedGuideInfo,
  GuideInfo,
} from "./types";

export const extendGuides = async (
  guides: GuideInfo[]
): Promise<ExtendedGuideInfo[]> => {
  return Promise.all(
    guides.map(async (guide) => {
      const returnStatus = await calculateReturnStatus(
        guide.returnsSubmitted,
        guide.feedbackReceived
      );
      const feedbackStatus = await calculateFeedbackStatus(
        guide.feedbackGiven,
        guide.availableForFeedback
      );
      const reviewsReceivedStatus = await calculateReviewsReceivedStatus(
        guide.gradesReceived
      );
      const reviewScore = await calculateReviewScore(guide.gradesReceived);
      const reviewGivenStatus = await calculateReviewsGivenStatus(
        guide.gradesGiven,
        guide.availableToGrade
      );

      const extendedGuide = {
        ...guide,
        link: `/guides/${guide._id}`,
        returnStatus,
        feedbackStatus,
        reviewsReceivedStatus,
        reviewScore,
        reviewGivenStatus,
      };

      return extendedGuide;
    })
  );
};

export const calculateReturnStatus = async (
  returnsSubmitted: ReturnDocument[],
  feedbackReceived: FeedbackDocument[]
): Promise<ReturnStatus> => {
  if (returnsSubmitted.length === 0) {
    return ReturnStatus.NOT_RETURNED;
  }

  const latestSubmission = returnsSubmitted.reduce(
    (latestSubmission, submission) => {
      if (submission.createdAt > latestSubmission.createdAt) {
        return submission;
      }
      return latestSubmission;
    }
  );
  const feedbackOnLatestSubmission = feedbackReceived.filter((feedback) => {
    return feedback.return === latestSubmission._id;
  });

  if (
    feedbackOnLatestSubmission.filter(
      (feedback) => feedback.vote === Vote.NO_PASS
    ).length > 1
  ) {
    return ReturnStatus.FAILED;
  }
  if (feedbackOnLatestSubmission.length < 2) {
    return ReturnStatus.AWAITING_FEEDBACK;
  }

  if (
    feedbackOnLatestSubmission.filter(
      (feedback) => feedback.vote === Vote.RECOMMEND_TO_GALLERY
    ).length > 0
  ) {
    return ReturnStatus.HALL_OF_FAME;
  }

  return ReturnStatus.PASSED;
};

export const calculateFeedbackStatus = async (
  feedbackGiven: FeedbackDocument[],
  availableForFeedback: ReturnDocument[]
): Promise<FeedbackStatus> => {
  if (feedbackGiven.length < 2 && availableForFeedback.length === 0) {
    return FeedbackStatus.AWAITING_PROJECTS;
  }
  if (feedbackGiven.length < 2) {
    return FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK;
  }
  return FeedbackStatus.FEEDBACK_GIVEN;
};

export const calculateReviewsReceivedStatus = async (
  gradesReceived: GradedFeedbackDocument[]
): Promise<ReviewsReceivedStatus> => {
  if (gradesReceived.length < 2) {
    return ReviewsReceivedStatus.AWAITING_REVIEWS;
  }
  return ReviewsReceivedStatus.GRADES_RECEIVED;
};

export const calculateReviewScore = async (
  gradesReceived: GradedFeedbackDocument[]
): Promise<number | undefined> => {
  if (gradesReceived.length < 2) {
    return undefined;
  }
  const highestTwoReviews = gradesReceived
    .sort((a, b) => b.grade - a.grade)
    .slice(0, 2);

  return (highestTwoReviews[0].grade + highestTwoReviews[1].grade) / 2;
};

export const calculateReviewsGivenStatus = async (
  gradesGiven: GradedFeedbackDocument[],
  availableToGrade: ReturnDocument[]
): Promise<ReviewsGivenStatus> => {
  if (gradesGiven.length >= 2) {
    return ReviewsGivenStatus.GRADES_GIVEN;
  }
  if (availableToGrade.length > 0) {
    return ReviewsGivenStatus.NEED_TO_REVIEW;
  }

  return ReviewsGivenStatus.AWAITING_FEEDBACK;
};
