import { Types } from "mongoose";
import { ModuleType } from "../models/guide";
import { FeedbackDocument, GradedFeedbackDocument } from "../models/review";
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

  // grades received by others on feedback given by this user
  gradesReceived: GradedFeedbackDocument[];

  // grading others' feedback
  gradesGiven: GradedFeedbackDocument[];
  availableToGrade: ReturnDocument[];
};

export type GuideWithLink = GuideInfo & { link: string };

export type Module = {
  title: string;
  number: number;
};

export type ExtendedGuideInfo = GuideWithLink & {
  link: string;
  returnStatus: ReturnStatus;
  feedbackStatus: FeedbackStatus;
  gradesReceivedStatus: GradesReceivedStatus;
  grade: number | undefined;
  gradesGivenStatus: GradesGivenStatus;
};

export enum ReturnStatus {
  NOT_RETURNED = "Not Returned",
  AWAITING_FEEDBACK = "Awaiting feedback",
  PASSED = "Passed",
  HALL_OF_FAME = "In Hall of Fame",
  FAILED = "Failed",
}

export enum FeedbackStatus {
  AWAITING_PROJECTS = "Awaiting projects to grade",
  NEED_TO_PROVIDE_FEEDBACK = "Need to provide feedback",
  FEEDBACK_GIVEN = "Feedback given",
}

export enum GradesReceivedStatus {
  AWAITING_GRADES = "Awaiting grades",
  GRADES_RECEIVED = "Grades received",
}

export enum GradesGivenStatus {
  AWAITING_FEEDBACK = "Awaiting feedback to grade",
  NEED_TO_GRADE = "Need to grade",
  GRADES_GIVEN = "Grades given",
}
