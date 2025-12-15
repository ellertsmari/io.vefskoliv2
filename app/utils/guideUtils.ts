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
} from "types/guideTypes";
import {
  REQUIRED_REVIEWS_COUNT,
  REQUIRED_GRADES_COUNT,
  FAIL_THRESHOLD,
  GRADES_TO_AVERAGE,
} from "constants/peerReview";

export const extendGuides = (guides: GuideInfo[]): ExtendedGuideInfo[] => {
  return guides.map((guide) => {
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
    const grade = calculateGrade(guide.gradesReceived, returnStatus);
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
  returnStatus?: ReturnStatus
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

  // If no graded reviews yet, just show the return points
  if (gradesReceived.length < GRADES_TO_AVERAGE) {
    return returnPoints;
  }

  // Calculate review points from the highest graded reviews
  const highestGrades = gradesReceived
    .sort((a, b) => b.grade - a.grade)
    .slice(0, GRADES_TO_AVERAGE);

  const reviewGradeSum = highestGrades.reduce((acc, g) => acc + g.grade, 0);
  const reviewGradeAverage = reviewGradeSum / GRADES_TO_AVERAGE;

  // Review grade is on a scale of 1-10, scale it to 0-5
  const reviewPoints = (reviewGradeAverage / 10) * 5;

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

/**
 * Extracts the module number from a module title string.
 * Expects format like "3 - The fundamentals" or "10 - Advanced topics"
 */
const extractModuleNumber = (title: string): number => {
  const match = title.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

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
