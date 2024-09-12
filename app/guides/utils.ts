"use server";
import { ReturnDocument } from "../models/return";
import {
  FeedbackDocument,
  ReviewedFeedbackDocument,
  Vote,
} from "../models/review";
import {
  ReturnStatus,
  FeedbackStatus,
  ReviewsReceivedStatus,
  ReviewsGivenStatus,
} from "./types";

export const calculateReturnStatus = (
  returnedGuides: ReturnDocument[],
  feedbackReceived: FeedbackDocument[]
): ReturnStatus => {
  if (returnedGuides.length === 0) {
    return ReturnStatus.NOT_RETURNED;
  }

  const latestSubmission = returnedGuides.reduce(
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
    ).length > 0
  ) {
    return ReturnStatus.FAILED;
  }
  if (feedbackOnLatestSubmission.length < 2) {
    return ReturnStatus.AWAITING_FEEDBACK;
  }

  return ReturnStatus.PASSED;
};

export const calculateFeedbackStatus = (
  feedbackGiven: FeedbackDocument[],
  availableForFeedback: ReturnDocument[]
): FeedbackStatus => {
  if (feedbackGiven.length < 2 && availableForFeedback.length === 0) {
    return FeedbackStatus.AWAITING_PROJECTS;
  }
  if (feedbackGiven.length < 2) {
    return FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK;
  }
  return FeedbackStatus.FEEDBACK_GIVEN;
};

export const calculateReviewsReceivedStatus = (
  reviewsReceived: ReviewedFeedbackDocument[]
): ReviewsReceivedStatus => {
  if (reviewsReceived.length < 2) {
    return ReviewsReceivedStatus.AWAITING_REVIEWS;
  }
  return ReviewsReceivedStatus.REVIEWS_RECEIVED;
};

export const calculateReviewScore = (
  reviewsReceived: ReviewedFeedbackDocument[]
): number | undefined => {
  if (reviewsReceived.length < 2) {
    return undefined;
  }
  const highestTwoReviews = reviewsReceived
    .sort((a, b) => b.grade - a.grade)
    .slice(0, 2);

  return (highestTwoReviews[0].grade + highestTwoReviews[1].grade) / 2;
};

export const calculateReviewGivenStatus = (
  reviewsGiven: ReviewedFeedbackDocument[],
  availableToReview: ReturnDocument[]
): ReviewsGivenStatus => {
  if (reviewsGiven.length >= 2) {
    return ReviewsGivenStatus.REVIEWS_GIVEN;
  }
  if (availableToReview.length > 0) {
    return ReviewsGivenStatus.NEED_TO_REVIEW;
  }

  return ReviewsGivenStatus.AWAITING_FEEDBACK;
};
