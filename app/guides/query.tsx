import { connectToDatabase } from "../utils/mongoose-connector";
import { Guide, ModuleType } from "../models/guide";
import { ObjectId } from "mongodb";
import { UserDocument } from "../models/user";
import { ReturnType } from "../models/return";
import { FeedbackDocument, ReviewedFeedbackDocument } from "../models/review";
import { PipelineStage, Types } from "mongoose";

enum ReturnStatus {
  NOT_RETURNED = "Guide not returned",
  RETURNED_AWAITING_REVIEW = "Guide returned and awaiting review",
  RETURNED_PASSED = "Guide returned and passed",
  RETURNED_FAILED = "Guide returned and failed",
}

enum FeedbackToGiveStatus {
  NO_FEEDBACK_TO_GIVE = "No feedback to give",
  FEEDBACK_TO_GIVE = "Feedback to give",
}

export enum ReviewsReceivedStatus {
  NO_REVIEW = "No reviews received",
  ONE_REVIEW = "1 Review received",
  TWO_OR_MORE_REVIEWS = "Reviews received",
}

const enum ReviewsToGiveStatus {
  NO_REVIEWS_TO_GIVE = "No reviews to give",
  REVIEWS_TO_GIVE = "Reviews to give",
}

export type GuideInfo = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  order: number;
  module: ModuleType;

  // this user's project returns
  returnStatus: ReturnStatus;
  returnsSubmitted: ReturnType[];
  feedbackReceived: FeedbackDocument[];

  // giving feedback on others' returns
  feedbackToGiveStatus: FeedbackToGiveStatus; // calculcate this and create typing
  availableForFeedback: ReturnType[];
  feedbackGiven: FeedbackDocument[];
  feedbackGivenCount: number;

  // reviews received by others on feedback given by this user
  reviewsReceivedStatus: ReviewsReceivedStatus;
  reviewsReceived: ReviewedFeedbackDocument[];
  reviewsReceivedGrades: number[];

  // reviewing others' feedback
  reviewsToGiveStatus: ReviewsToGiveStatus;
  reviewsGiven: ReviewedFeedbackDocument[];
  availableToReview: ReturnType[];
};

export type GuideInfoWithLink = GuideInfo & {
  individualGuideLink: string;
};

export async function getGuides(
  user: UserDocument | null
): Promise<GuideInfo[] | null> {
  if (!user) return null;
  await connectToDatabase();

  const userId = new ObjectId(user._id);

  // grab user's submitted returns
  const lookupReturnsSubmitted: PipelineStage = {
    $lookup: {
      from: "returns",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $eq: ["$owner", userId] },
              ],
            },
          },
        },
      ],
      as: "returnsSubmitted",
    },
  };

  // grab feedback given by user
  const lookupFeedbackGiven: PipelineStage = {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $eq: ["$owner", userId] },
              ],
            },
          },
        },
      ],
      as: "feedbackGiven",
    },
  };

  // grab returns available for reviewing
  const lookupAvailableForFeedback: PipelineStage = {
    $lookup: {
      from: "returns",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $ne: ["$owner", userId] },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "reviews",
            localField: "_id", // return ID
            foreignField: "return", // connecting return field in review schema
            as: "associatedReviews",
          },
        },
        {
          $match: {
            "associatedReviews.owner": {
              $ne: userId,
            },
          },
        },
        {
          $sort: {
            reviewedAt: 1, // Ascending order by reviewedAt
            createdAt: 1, // Ascending order by createdAt
          },
        },
      ],
      as: "availableForFeedback",
    },
  };

  // grab reviews given by user
  const lookupReviewsGiven: PipelineStage = {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $eq: ["$reviewer", userId] },
              ],
            },
          },
        },
      ],
      as: "reviewsGiven",
    },
  };

  // grab feedback available for reviewing by user
  const lookupAvailableToReview: PipelineStage = {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $ne: ["$owner", userId] },
                { $ne: ["$reviewer", userId] },
              ],
            },
          },
        },
      ],
      as: "availableToReview",
    },
  };

  // grab feedbackReceived from others
  const lookupFeedbackReceived: PipelineStage = {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        // First, perform a lookup on the Return collection
        {
          $lookup: {
            from: "returns",
            localField: "return",
            foreignField: "_id",
            as: "returnData",
          },
        },
        // Unwind the array, so we can easily access the owner field
        {
          $unwind: "$returnData",
        },
        // Filter by guide and owner
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $ne: ["$owner", userId] },
                { $eq: ["$returnData.owner", userId] },
              ],
            },
          },
        },
      ],
      as: "feedbackReceived",
    },
  };

  // grab reviews received from others
  const lookupReviewsReceived: PipelineStage = {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        // First, perform a lookup on the Return collection
        {
          $lookup: {
            from: "returns",
            localField: "return",
            foreignField: "_id",
            as: "returnData",
          },
        },
        // Unwind the array, so we can easily access the owner field
        {
          $unwind: "$returnData",
        },
        // Filter by guide and owner
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $eq: ["$owner", userId] },
                { $ne: ["$reviewer", userId] },
              ],
            },
          },
        },
      ],
      as: "reviewsReceived",
    },
  };

  const calculateReturnStatus: PipelineStage = {
    $addFields: {
      returnStatus: {
        $switch: {
          branches: [
            {
              case: { $eq: [{ $size: "$returnsSubmitted" }, 0] },
              then: ReturnStatus.NOT_RETURNED,
            },
            {
              case: {
                $and: [
                  {
                    $gt: [
                      { $max: "$feedbackReceived.createdAt" },
                      { $max: "$returnsSubmitted.createdAt" },
                    ],
                  },
                  {
                    $eq: ["$feedbackReceived.vote", "no pass"],
                  },
                ],
              },
              then: ReturnStatus.RETURNED_FAILED,
            },
            {
              case: {
                $and: [
                  { $lt: [{ $size: "$reviewsGiven" }, 2] },
                  {
                    $gt: [
                      { $max: "$reviewsGiven.createdAt" },
                      { $max: "$returnsSubmitted.createdAt" },
                    ],
                  },
                ],
              },
              then: ReturnStatus.RETURNED_AWAITING_REVIEW,
            },
          ],
          default: ReturnStatus.RETURNED_FAILED,
        },
      },
    },
  };

  const calculateFeedbackToGiveStatus: PipelineStage = {
    $addFields: {
      feedbackToGiveStatus: {
        $switch: {
          branches: [
            {
              case: { $gte: [{ $size: "$feedbackGiven" }, 2] },
              then: FeedbackToGiveStatus.NO_FEEDBACK_TO_GIVE,
            },
          ],
          default: FeedbackToGiveStatus.FEEDBACK_TO_GIVE,
        },
      },
    },
  };

  const calculateReviewsReceivedStatus: PipelineStage = {
    $addFields: {
      reviewsReceivedStatus: {
        $switch: {
          branches: [
            {
              case: { $eq: [{ $size: "$reviewsReceived" }, 0] },
              then: ReviewsReceivedStatus.NO_REVIEW,
            },
            {
              case: { $eq: [{ $size: "$reviewsReceived" }, 1] },
              then: ReviewsReceivedStatus.ONE_REVIEW,
            },
          ],
          default: ReviewsReceivedStatus.TWO_OR_MORE_REVIEWS,
        },
      },
    },
  };

  const calculateReviewsToGiveStatus: PipelineStage = {
    $addFields: {
      reviewsToGiveStatus: {
        $switch: {
          branches: [
            {
              case: { $lt: [{ $size: "$reviewsGiven" }, 2] },
              then: ReviewsToGiveStatus.REVIEWS_TO_GIVE,
            },
          ],
          default: ReviewsToGiveStatus.NO_REVIEWS_TO_GIVE,
        },
      },
    },
  };

  // define the final document structure

  const defineProject: PipelineStage = {
    $project: {
      _id: 1,
      title: 1,
      description: 1,
      category: 1,
      order: 1,
      module: 1,

      // this user's project returns
      returnStatus: 1,
      returnsSubmitted: 1,
      feedbackReceived: 1,

      // giving feedback on others' returns
      feedbackToGiveStatus: 1,
      availableForFeedback: 1,
      feedbackGiven: 1,
      feedbackGivenCount: { $size: "$feedbackGiven" },

      // reviews received by others on feedback given by this user
      reviewsReceivedStatus: 1,
      reviewsReceived: 1,
      reviewsReceivedGrades: {
        $map: {
          input: "$reviewsReceived",
          as: "review",
          in: "$$review.grade",
        },
      },

      // reviewing others' feedback
      reviewsToGiveStatus: 1,
      reviewsGiven: 1,
      availableToReview: 1,
    },
  };

  try {
    return await Guide.aggregate([
      // lookup stages
      lookupReturnsSubmitted,
      lookupFeedbackGiven,
      lookupAvailableForFeedback,
      lookupReviewsGiven,
      lookupAvailableToReview,
      lookupFeedbackReceived,
      lookupReviewsReceived,

      // calculations
      calculateReturnStatus,
      calculateFeedbackToGiveStatus,
      calculateReviewsReceivedStatus,
      calculateReviewsToGiveStatus,

      defineProject,
      {
        $sort: {
          order: 1, // Ascending order by order
        },
      },
    ] as PipelineStage[]).exec();
  } catch (e) {
    console.error("Failed to fetch guides:", e);
    throw e;
  }
}
