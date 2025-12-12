import { Types } from "mongoose";
import { ModuleType } from "../app/models/guide";
import { ReviewDocument, GradedReviewDocument } from "../app/models/review";
import { ReturnDocument } from "../app/models/return";

export type ReviewDocumentWithReturn = ReviewDocument & {
  associatedReturn?: ReturnDocument;
};

export type GuideInfo = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  order: number;
  module: ModuleType;

  // this user's project returns
  returnsSubmitted: ReturnDocument[];
  reviewsReceived: ReviewDocument[];

  // reviewing others' returns
  availableForReview: ReturnDocument[];
  reviewsGiven: ReviewDocumentWithReturn[];

  // grades received by others on reviews given by this user
  gradesReceived: GradedReviewDocument[];

  // grading others' reviews
  gradesGiven: GradedReviewDocument[];
  availableToGrade: ReviewDocument[];
};

/** @deprecated Use ReviewDocumentWithReturn instead */
export type FeedbackDocumentWithReturn = ReviewDocumentWithReturn;

export type GuideWithLink = GuideInfo & { link: string };

export type Module = {
  title: string;
  number: number;
};

export type ExtendedGuideInfo = GuideWithLink & {
  link: string;
  returnStatus: ReturnStatus;
  reviewStatus: ReviewStatus;
  gradesReceivedStatus: GradesReceivedStatus;
  grade: number | undefined;
  gradesGivenStatus: GradesGivenStatus;
};

export enum ReturnStatus {
  NOT_RETURNED = "Not Returned",
  AWAITING_REVIEWS = "AWAITING REVIEWS",
  PASSED = "PASSED",
  HALL_OF_FAME = "HALL OF FAME",
  FAILED = "FAILED",
}

export enum ReviewStatus {
  AWAITING_PROJECTS = "Awaiting projects to review",
  NEED_TO_REVIEW = "GIVE REVIEW",
  REVIEWS_GIVEN = "Reviews given",
}

export enum GradesGivenStatus {
  AWAITING_REVIEWS = "Awaiting reviews to grade",
  NEED_TO_GRADE = "GIVE GRADE",
  GRADES_GIVEN = "Grades given",
}

export enum GradesReceivedStatus {
  AWAITING_GRADES = "Awaiting grades",
  GRADES_RECEIVED = "Grades received",
}

// Legacy aliases for backwards compatibility
/** @deprecated Use ReturnStatus.AWAITING_REVIEWS instead */
export const AWAITING_FEEDBACK = ReturnStatus.AWAITING_REVIEWS;
/** @deprecated Use ReviewStatus instead */
export const FeedbackStatus = ReviewStatus;
