import { connectToDatabase } from "../utils/mongoose-connector";
import { Guide, ModuleType } from "../models/guide";
import { ObjectId } from "mongodb";
import { UserDocument } from "../models/user";
import { ReturnType } from "../models/return";
import { FeedbackDocument, ReviewedFeedbackDocument } from "../models/review";
import { PipelineStage, Types } from "mongoose";

export type GuideInfo = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  category: string;
  order: number;
  module: ModuleType;

  // this user's project returns
  returnsSubmitted: ReturnType[];
  feedbackReceived: FeedbackDocument[];

  // giving feedback on others' returns
  availableForFeedback: ReturnType[];
  feedbackGiven: FeedbackDocument[];

  // reviews received by others on feedback given by this user
  reviewsReceived: ReviewedFeedbackDocument[];

  // reviewing others' feedback
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
      returnsSubmitted: 1,
      feedbackReceived: 1,

      // giving feedback on others' returns
      availableForFeedback: 1,
      feedbackGiven: 1,

      // reviews received by others on feedback given by this user
      reviewsReceived: 1,

      // reviewing others' feedback
      reviewsGiven: 1,
      availableToReview: 1,
    },
  };

  try {
    return await Guide.aggregate([
      lookupReturnsSubmitted,
      lookupFeedbackGiven,
      lookupAvailableForFeedback,
      lookupReviewsGiven,
      lookupAvailableToReview,
      lookupFeedbackReceived,
      lookupReviewsReceived,

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
