// this will be used to display the status of the guide

// For each guide we have these "states"

// Return statues
// - Guide not returned
// - Guide returned and not reviewed
// - Guide returned and passed
// - Guide returned and failed

enum ReturnStatus {
  NOT_RETURNED = "Guide not returned",
  RETURNED_NOT_REVIEWED = "Guide returned and not reviewed",
  RETURNED_PASSED = "Guide returned and passed",
  RETURNED_FAILED = "Guide returned and failed",
}

enum ReviewStatus {
  NO_REVIEW = "Review not given",
  ONE_REVIEW = "1 Review given",
  TWO_OR_MORE_REVIEWS = "2 or more Reviews given",
}

// Review statues
// - Review not given
// - 1 Review given
// - 2 or more Reviews given
