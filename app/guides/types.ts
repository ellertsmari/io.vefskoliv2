import { Types } from "mongoose";
import { ModuleType } from "../models/guide";
import {
  FeedbackDocument,
  Review,
  ReviewedFeedbackDocument,
} from "../models/review";
import { ReturnDocument, ReturnType } from "../models/return";

export type GuideInfo = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  order: number;
  module: ModuleType;

  // this user's project returns
  returnsSubmitted: ReturnDocument[];
  feedbackReceived: FeedbackDocument[];

  // giving feedback on others' returns
  availableForFeedback: ReturnDocument[];
  feedbackGiven: FeedbackDocument[];

  // reviews received by others on feedback given by this user
  reviewsReceived: ReviewedFeedbackDocument[];

  // reviewing others' feedback
  reviewsGiven: ReviewedFeedbackDocument[];
  availableToReview: ReturnType[];
};

export type Module = {
  title: string;
  number: number;
};

export type GuideInfoWithLink = GuideInfo & {
  individualGuideLink: string;
};

export enum ReturnStatus {
  NOT_RETURNED = "Not Returned",
  AWAITING_FEEDBACK = "Awaiting feedback",
  PASSED = "Passed",
  FAILED = "Failed",
}

export enum FeedbackStatus {
  AWAITING_PROJECTS = "Awaiting projects to review",
  NEED_TO_PROVIDE_FEEDBACK = "Need to provide feedback",
  FEEDBACK_GIVEN = "Feedback given",
}

export enum ReviewsReceivedStatus {
  AWAITING_REVIEWS = "Awaiting reviews from others",
  REVIEWS_RECEIVED = "Reviews received",
}

export enum ReviewsGivenStatus {
  AWAITING_FEEDBACK = "Awaiting feedback to review",
  NEED_TO_REVIEW = "Need to review",
  REVIEWS_GIVEN = "Reviews given",
}
