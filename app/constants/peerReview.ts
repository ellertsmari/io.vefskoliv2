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

/**
 * Grace period (in days) the peer-review process is given to complete before a
 * student is graded on partial reviews.
 *
 * Normally a student must give REQUIRED_REVIEWS_COUNT reviews to earn full review
 * points. Within this window they must still give the required reviews whenever
 * projects are available. But once this many days have passed since they first
 * submitted the guide, we apply a "soft floor": we grade them on whatever reviews
 * they did manage to give, regardless of whether more projects later appear. This
 * means a late-arriving project can no longer drag an already-earned grade back
 * down. See `hasExceededReviewGracePeriod`.
 */
export const REVIEW_GRACE_PERIOD_DAYS = 14;

/**
 * Months when final grades are issued, as JS `Date.getMonth()` values (0-indexed):
 * May (4), August (7), December (11).
 *
 * During these months the review grace period is WAIVED: a student's earned
 * reviews count toward their grade immediately, with no 14-day wait, so grades
 * are accurate and final when teachers issue them. See `isGradingMonth`.
 */
export const GRADING_MONTHS = [4, 7, 11];
