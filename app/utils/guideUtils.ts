import { ReturnDocument } from "models/return";
import { ReviewDocument, GradedReviewDocument, Vote } from "models/review";
import {
  ReturnStatus,
  ReviewStatus,
  GradesReceivedStatus,
  GradesGivenStatus,
  ExtendedGuideInfo,
  GuideInfo,
  Module,
  GradingMode,
  ExerciseAttemptInfo,
} from "types/guideTypes";
import {
  REQUIRED_REVIEWS_COUNT,
  REQUIRED_GRADES_COUNT,
  FAIL_THRESHOLD,
  GRADES_TO_AVERAGE,
  REVIEW_GRACE_PERIOD_DAYS,
  GRADING_MONTHS,
} from "constants/peerReview";
import { extractModuleNumber } from "utils/moduleUtils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const extendGuides = (
  guides: GuideInfo[],
  now: Date = new Date()
): ExtendedGuideInfo[] => {
  return guides.map((guide) => {
    // Auto-graded guides skip peer review entirely: status and grade come from
    // the student's best exercise attempt, and the review/grade steps are N/A.
    if (guide.gradingMode === GradingMode.AUTO) {
      return extendAutoGuide(guide);
    }

    const returnStatus = calculateReturnStatus(
      guide.returnsSubmitted,
      guide.reviewsReceived
    );
    const reviewStatus = calculateReviewStatus(
      guide.reviewsGiven,
      guide.availableForReview
    );
    const gradesReceivedStatus = calculateGradesReceivedStatus(
      guide.gradesReceived
    );
    // A single graded review counts toward the grade when EITHER:
    //  - it's a grading month (May/Aug/Dec), when the grace period is waived so
    //    grades are accurate and final at grading time, OR
    //  - the 14-day grace period has passed (the "soft floor"), so a late
    //    project can't drag an already-earned grade back down.
    // Within the grace period (outside grading months) students must still give
    // the required reviews when projects are available, enforced via reviewStatus.
    const gradePartialReviews =
      isGradingMonth(now) ||
      hasExceededReviewGracePeriod(guide.returnsSubmitted, now);
    const grade = calculateGrade(
      guide.gradesReceived,
      returnStatus,
      gradePartialReviews
    );
    const gradesGivenStatus = calculateGradesGivenStatus(
      guide.gradesGiven,
      guide.availableToGrade
    );

    return {
      ...guide,
      link: `/guides/${guide._id}`,
      returnStatus,
      reviewStatus,
      gradesReceivedStatus,
      grade,
      gradesGivenStatus,
    };
  });
};

/**
 * The student's best attempt on an auto-graded guide, or undefined if none.
 * "Best" = highest score (ties broken arbitrarily, which is fine).
 */
export const bestAttempt = (
  attempts: ExerciseAttemptInfo[] = []
): ExerciseAttemptInfo | undefined => {
  if (attempts.length === 0) return undefined;
  return attempts.reduce((best, a) => (a.score > best.score ? a : best));
};

/**
 * Build the extended info for an auto-graded guide. The peer-review pipeline does
 * not apply, so reviews/grades are marked NOT_APPLICABLE and the grade is taken
 * directly from the best exercise attempt.
 */
const extendAutoGuide = (guide: GuideInfo): ExtendedGuideInfo => {
  const best = bestAttempt(guide.exerciseAttempts);

  let returnStatus: ReturnStatus;
  if (!best) {
    returnStatus = ReturnStatus.NOT_RETURNED;
  } else if (best.passed) {
    returnStatus = ReturnStatus.PASSED;
  } else {
    returnStatus = ReturnStatus.FAILED;
  }

  return {
    ...guide,
    link: `/guides/${guide._id}`,
    returnStatus,
    // No peer-review steps for auto-graded guides.
    reviewStatus: ReviewStatus.NOT_APPLICABLE,
    gradesReceivedStatus: GradesReceivedStatus.NOT_APPLICABLE,
    gradesGivenStatus: GradesGivenStatus.NOT_APPLICABLE,
    // Grade is the best attempt's score; undefined until the student attempts it.
    grade: best ? best.score : undefined,
  };
};

export const calculateReturnStatus = (
  returnsSubmitted: ReturnDocument[],
  reviewsReceived: ReviewDocument[]
): ReturnStatus => {
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
  const reviewsOnLatestSubmission = reviewsReceived.filter((review) => {
    // Convert both to strings for comparison to handle serialized ObjectIds
    return review.return.toString() === latestSubmission._id.toString();
  });

  if (
    reviewsOnLatestSubmission.filter((review) => review.vote === Vote.NO_PASS)
      .length >= FAIL_THRESHOLD
  ) {
    return ReturnStatus.FAILED;
  }
  if (reviewsOnLatestSubmission.length < REQUIRED_REVIEWS_COUNT) {
    return ReturnStatus.AWAITING_REVIEWS;
  }

  if (
    reviewsOnLatestSubmission.filter(
      (review) => review.vote === Vote.RECOMMEND_TO_GALLERY
    ).length > 0
  ) {
    return ReturnStatus.HALL_OF_FAME;
  }

  return ReturnStatus.PASSED;
};

export const calculateReviewStatus = (
  reviewsGiven: ReviewDocument[],
  availableForReview: ReturnDocument[]
): ReviewStatus => {
  if (reviewsGiven.length < REQUIRED_REVIEWS_COUNT && availableForReview.length)
    return ReviewStatus.NEED_TO_REVIEW;

  if (reviewsGiven.length < REQUIRED_REVIEWS_COUNT)
    return ReviewStatus.AWAITING_PROJECTS;

  return ReviewStatus.REVIEWS_GIVEN;
};

/**
 * Has the review grace period passed for this guide?
 *
 * Returns true once more than REVIEW_GRACE_PERIOD_DAYS have passed since the
 * student first submitted the guide. The clock starts at the student's *earliest*
 * return so that a resubmission doesn't reset it.
 *
 * Note this is intentionally time-only — it does NOT depend on whether projects
 * are currently available to review. That's what gives us the "soft floor": after
 * the grace period `calculateGrade` counts whatever reviews the student managed
 * to give, so a late-arriving project can't drop an already-earned grade. (The
 * student is still nudged to give the extra review via `reviewStatus`; it just no
 * longer changes their grade.)
 */
export const hasExceededReviewGracePeriod = (
  returnsSubmitted: ReturnDocument[],
  now: Date = new Date()
): boolean => {
  if (returnsSubmitted.length === 0) return false;

  const firstSubmission = returnsSubmitted.reduce((earliest, submission) =>
    new Date(submission.createdAt) < new Date(earliest.createdAt)
      ? submission
      : earliest
  );

  const daysSinceFirstReturn =
    (now.getTime() - new Date(firstSubmission.createdAt).getTime()) / MS_PER_DAY;

  return daysSinceFirstReturn > REVIEW_GRACE_PERIOD_DAYS;
};

/**
 * Is `now` in a grading month (May/August/December)?
 *
 * During these months final grades are issued, so the review grace period is
 * waived entirely — a student's earned reviews count toward their grade right
 * away (no 14-day wait), keeping grades accurate and final at grading time.
 */
export const isGradingMonth = (now: Date = new Date()): boolean =>
  GRADING_MONTHS.includes(now.getMonth());

export const calculateGradesReceivedStatus = (
  gradesReceived: GradedReviewDocument[]
): GradesReceivedStatus => {
  if (gradesReceived.length < REQUIRED_GRADES_COUNT) {
    return GradesReceivedStatus.AWAITING_GRADES;
  }
  return GradesReceivedStatus.GRADES_RECEIVED;
};

export const calculateGrade = (
  gradesReceived: GradedReviewDocument[],
  returnStatus?: ReturnStatus,
  // When true, the student is graded on whatever reviews they managed to give,
  // even if that's fewer than GRADES_TO_AVERAGE. Set by `extendGuides` once the
  // review grace period has passed (see `hasExceededReviewGracePeriod`).
  gradePartialReviews: boolean = false
): number | undefined => {
  // If the guide has failed (no pass), no grade is given
  if (returnStatus === ReturnStatus.FAILED) {
    return undefined;
  }

  // If the guide hasn't been returned yet, no grade
  if (!returnStatus || returnStatus === ReturnStatus.NOT_RETURNED) {
    return undefined;
  }

  // Base 5 points for returning a guide
  const returnPoints = 5;

  // How many graded reviews must exist before review points count toward the
  // grade. Normally we wait for the full GRADES_TO_AVERAGE so an early single
  // grade doesn't lock in a final score. But a student stuck awaiting projects
  // can't reach that count, so we count even a single graded review for them.
  const minGradedReviewsToCount = gradePartialReviews ? 1 : GRADES_TO_AVERAGE;

  // Not enough graded reviews yet — just show the return points.
  if (gradesReceived.length < minGradedReviewsToCount) {
    return returnPoints;
  }

  // Average the student's highest grades (at most GRADES_TO_AVERAGE of them).
  const highestGrades = gradesReceived
    .sort((a, b) => b.grade - a.grade)
    .slice(0, GRADES_TO_AVERAGE);

  const reviewGradeSum = highestGrades.reduce((acc, g) => acc + g.grade, 0);
  // Divide by how many grades we actually summed, not the target count, so a
  // single graded review isn't diluted by a missing second grade.
  const reviewGradeAverage = reviewGradeSum / highestGrades.length;

  // The review grade is on a 0-10 scale and the review half of the grade is
  // worth up to 5 points. Rescaling 0-10 down to 0-5 is just halving:
  // (reviewGradeAverage / 10) * 5 === reviewGradeAverage / 2.
  const reviewPoints = reviewGradeAverage / 2;

  return Math.round((returnPoints + reviewPoints) * 10) / 10;
};

export const calculateGradesGivenStatus = (
  gradesGiven: GradedReviewDocument[],
  availableToGrade: ReviewDocument[]
): GradesGivenStatus => {
  if (gradesGiven.length < REQUIRED_GRADES_COUNT && availableToGrade.length)
    return GradesGivenStatus.NEED_TO_GRADE;

  if (gradesGiven.length < REQUIRED_GRADES_COUNT)
    return GradesGivenStatus.AWAITING_REVIEWS;

  return GradesGivenStatus.GRADES_GIVEN;
};

/** @deprecated Use calculateReviewStatus instead */
export const calculateFeedbackStatus = calculateReviewStatus;

export const fetchModules = (extendedGuides: ExtendedGuideInfo[]): Module[] => {
  return extendedGuides
    .reduce((acc: Module[], guideToCheck) => {
      const moduleNumber = extractModuleNumber(guideToCheck.module.title);
      if (!acc.some((existingGuide) => moduleNumber === existingGuide.number)) {
        acc.push({
          title: guideToCheck.module.title,
          number: moduleNumber,
        });
      }
      return acc;
    }, [] as { title: string; number: number }[])
    .sort((a, b) => a.number - b.number);
};
