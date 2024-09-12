// this will be used to display the status of the guide

// For each guide we have these "states"

export enum ReturnStatus {
  NOT_RETURNED = "Guide not returned",
  RETURNED_AWAITING_REVIEW = "Guide returned and awaiting review",
  RETURNED_PASSED = "Guide returned and passed",
  RETURNED_FAILED = "Guide returned and failed",
}

export enum FeedbackToGiveStatus {
  NO_FEEDBACK_TO_GIVE = "No feedback to give",
  FEEDBACK_TO_GIVE = "Feedback to give",
}

export enum ReviewsReceivedStatus {
  NO_REVIEW = "No reviews received",
  ONE_REVIEW = "1 Review received",
  TWO_OR_MORE_REVIEWS = "Reviews received",
}

export const enum ReviewsToGiveStatus {
  NO_REVIEWS_TO_GIVE = "No reviews to give",
  REVIEWS_TO_GIVE = "Reviews to give",
}
