import { ReturnDocument } from "models/return";
import { FeedbackDocument, GradedFeedbackDocument, Vote } from "models/review";
import {
  ReturnStatus,
  FeedbackStatus,
  GradesReceivedStatus,
  GradesGivenStatus,
  ExtendedGuideInfo,
  GuideInfo,
  Module,
} from "types/guideTypes";

export const extendGuides = (guides: GuideInfo[]): ExtendedGuideInfo[] => {
  return guides.map((guide) => {
    const returnStatus = calculateReturnStatus(
      guide.returnsSubmitted,
      guide.feedbackReceived
    );
    const feedbackStatus = calculateFeedbackStatus(
      guide.feedbackGiven,
      guide.availableForFeedback
    );
    const gradesReceivedStatus = calculateGradesReceivedStatus(
      guide.gradesReceived
    );
    const grade = calculateGrade(guide.gradesReceived);
    const gradesGivenStatus = calculateGradesGivenStatus(
      guide.gradesGiven,
      guide.availableToGrade
    );

    return {
      ...guide,
      link: `/guides/${guide._id}`,
      returnStatus,
      feedbackStatus,
      gradesReceivedStatus,
      grade,
      gradesGivenStatus,
    };
  });
};

export const calculateReturnStatus = (
  returnsSubmitted: ReturnDocument[],
  feedbackReceived: FeedbackDocument[]
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
  const feedbackOnLatestSubmission = feedbackReceived.filter((feedback) => {
    // Convert both to strings for comparison to handle serialized ObjectIds
    return feedback.return.toString() === latestSubmission._id.toString();
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
  if (feedbackGiven.length < 2 && availableForFeedback.length)
    return FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK;

  if (feedbackGiven.length < 2) return FeedbackStatus.AWAITING_PROJECTS;

  return FeedbackStatus.FEEDBACK_GIVEN;
};

export const calculateGradesReceivedStatus = (
  gradesReceived: GradedFeedbackDocument[]
): GradesReceivedStatus => {
  if (gradesReceived.length < 2) {
    return GradesReceivedStatus.AWAITING_GRADES;
  }
  return GradesReceivedStatus.GRADES_RECEIVED;
};

export const calculateGrade = (
  gradesReceived: GradedFeedbackDocument[]
): number | undefined => {
  if (gradesReceived.length < 2) {
    return undefined;
  }
  const highestTwoGrades = gradesReceived
    .sort((a, b) => b.grade - a.grade)
    .slice(0, 2);

  return (highestTwoGrades[0].grade + highestTwoGrades[1].grade) / 2;
};

export const calculateGradesGivenStatus = (
  gradesGiven: GradedFeedbackDocument[],
  availableToGrade: FeedbackDocument[]
): GradesGivenStatus => {
  if (gradesGiven.length < 2 && availableToGrade.length)
    return GradesGivenStatus.NEED_TO_GRADE;

  if (gradesGiven.length < 2) return GradesGivenStatus.AWAITING_FEEDBACK;

  return GradesGivenStatus.GRADES_GIVEN;
};

export const fetchModules = (extendedGuides: ExtendedGuideInfo[]): Module[] => {
  return extendedGuides
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
