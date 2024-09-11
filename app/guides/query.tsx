import { connectToDatabase } from "../utils/mongoose-connector";
import { Guide, ModuleType } from "../models/guide";
import { ObjectId } from "mongodb";
import { UserDocument } from "../models/user";
import { ReturnType } from "../models/return";
import { ReviewType } from "../models/review";
import { PipelineStage, Types } from "mongoose";

export type GuideInfo = {
  category: string;
  description: string;
  isReturned: boolean;
  module: ModuleType;
  oldestReturnId: string;
  order: number;
  title: string;
  returnsSubmitted: ReturnType[];
  reviewsGiven: ReviewType[];
  numberOfReviewsGiven: number;
  reviewsReceived: ReviewType[];
  returnsToReview: ReturnType[];
  _id: Types.ObjectId;
};

export interface GuideInfoWithLink extends GuideInfo {
  individualGuideLink: string;
}

export async function getGuides(
  user: UserDocument | null
): Promise<GuideInfo[] | null> {
  if (!user) return null;
  await connectToDatabase();

  const userId = new ObjectId(user._id);

  // grab all returns that the user has made for the guide
  const lookupUserReturns: PipelineStage = {
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

  // grab all returns that the user could review for the guide
  const lookupReturnsToReview: PipelineStage = {
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
              $ne: userId, // Assuming userId is defined elsewhere in your script
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
      as: "returnsToReview",
    },
  };

  // grab all reviews made by the user for each guide
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
                { $eq: ["$owner", userId] },
              ],
            },
          },
        },
      ],
      as: "reviewsGiven",
    },
  };

  // grab reviews made by other users for the return that the user has made
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
                { $ne: ["$owner", userId] },
                { $eq: ["$returnData.owner", userId] },
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
      title: 1,
      description: 1,
      _id: 1,
      module: 1,
      returnsSubmitted: 1,
      returnDate: { $arrayElemAt: ["$returnsSubmitted.createdAt", 0] },
      // oldestReturnId: { $arrayElemAt: ["$returnsToReview._id", 0] },
      returnsToReview: 1,
      isReturned: { $gt: [{ $size: "$returnsSubmitted" }, 0] },
      numberOfReviewsGiven: { $size: "$reviewsGiven" },
      reviewsReceived: 1,
      reviewsGiven: 1,
      category: 1,
      order: 1,
    },
  };

  try {
    return await Guide.aggregate([
      lookupUserReturns,
      lookupReturnsToReview,
      lookupReviewsGiven,
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
