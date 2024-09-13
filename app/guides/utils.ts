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
  GuideInfoWithLink,
  Module,
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
  gradesReceived: GradedFeedbackDocument[]
): ReviewsReceivedStatus => {
  if (gradesReceived.length < 2) {
    return ReviewsReceivedStatus.AWAITING_REVIEWS;
  }
  return ReviewsReceivedStatus.GRADES_RECEIVED;
};

export const calculateReviewScore = (
  gradesReceived: GradedFeedbackDocument[]
): number | undefined => {
  if (gradesReceived.length < 2) {
    return undefined;
  }
  const highestTwoReviews = gradesReceived
    .sort((a, b) => b.grade - a.grade)
    .slice(0, 2);

  return (highestTwoReviews[0].grade + highestTwoReviews[1].grade) / 2;
};

export const calculateReviewGivenStatus = (
  gradesGiven: GradedFeedbackDocument[],
  availableToGrade: ReturnDocument[]
): ReviewsGivenStatus => {
  if (gradesGiven.length >= 2) {
    return ReviewsGivenStatus.GRADES_GIVEN;
  }
  if (availableToGrade.length > 0) {
    return ReviewsGivenStatus.NEED_TO_REVIEW;
  }

  return ReviewsGivenStatus.AWAITING_FEEDBACK;
};

export const fetchModules = (fetchedGuides: GuideInfoWithLink[]) => {
  return fetchedGuides
    .reduce((acc: Module[], guideToCheck) => {
      if (
        !acc.some(
          (existingGuide) =>
            (+guideToCheck.module.title[0] as number) === existingGuide.number
        )
      ) {
        acc.push({
          title: guideToCheck.module.title,
          number: +guideToCheck.module.title[0] as number,
        });
      }
      return acc;
    }, [] as { title: string; number: number }[])
    .sort((a, b) => a.number - b.number);
};

// Not ideal but improving this would require a refactor of the data model as we don't store number explicitly
// Currently, we are assuming that the module title is a number
export const filterGuides = (
  selectedModule: number | undefined,
  fetchedGuides: GuideInfoWithLink[]
) => {
  if (selectedModule === undefined) return fetchedGuides;
  return fetchedGuides.filter((guide) => {
    if (guide.module.title[0] === "" + selectedModule) return guide;
  });
};

export const createOptions = (
  modules: Module[],
  setSelectedModule: React.Dispatch<number | undefined>
) => {
  return [
    { optionName: "All", onClick: () => setSelectedModule(undefined) },
  ].concat(
    modules.map((module) => ({
      optionName: "Module " + module.number,
      onClick: () => setSelectedModule(module.number),
    }))
  );
};
