/**
 * Peer Review System Business Rules
 *
 * The peer review workflow:
 * 1. Student submits a project return
 * 2. Other students review the submission (REQUIRED_REVIEWS_COUNT reviews needed)
 * 3. Other students grade the reviews (REQUIRED_GRADES_COUNT grades needed)
 * 4. Final grade is the average of the top 2 grades received
 */

/** Number of reviews required for a submission to pass */
export const REQUIRED_REVIEWS_COUNT = 2;

/** Number of grades required to complete a review */
export const REQUIRED_GRADES_COUNT = 2;

/** Number of NO_PASS votes required for a submission to fail */
export const FAIL_THRESHOLD = 2;

/** Minimum grade value */
export const MIN_GRADE = 0;

/** Maximum grade value */
export const MAX_GRADE = 10;

/** Number of top grades to average for final grade */
export const GRADES_TO_AVERAGE = 2;

/** @deprecated Use REQUIRED_REVIEWS_COUNT instead */
export const REQUIRED_FEEDBACK_COUNT = REQUIRED_REVIEWS_COUNT;
