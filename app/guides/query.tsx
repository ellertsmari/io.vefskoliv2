import { connectToDatabase } from "../utils/mongoose-connector";
import { Guide } from "../models/guide";
import { ObjectId } from "mongodb";
import { UserDocument } from "../models/user";
import { PipelineStage } from "mongoose";
import { GuideInfo } from "./types";

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

  // grab grades given by user
  const lookupGradesGiven: PipelineStage = {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $lookup: {
            from: "returns",
            localField: "return",
            foreignField: "_id",
            as: "associatedReturn",
          },
        },
        { $unwind: "$associatedReturn" },
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $eq: ["$associatedReturn.owner", userId] },
              ],
            },
          },
        },
      ],
      as: "gradesGiven",
    },
  };

  // grab feedback available for reviewing by user
  const lookupAvailableToGrade: PipelineStage = {
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
      as: "availableToGrade",
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

  // grab grades received from others
  const lookupGradesReceived: PipelineStage = {
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
      as: "gradesReceived",
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
      gradesReceived: 1,

      // reviewing others' feedback
      gradesGiven: 1,
      availableToGrade: 1,
    },
  };

  try {
    return await Guide.aggregate([
      lookupReturnsSubmitted,
      lookupFeedbackGiven,
      lookupAvailableForFeedback,
      lookupGradesGiven,
      lookupAvailableToGrade,
      lookupFeedbackReceived,
      lookupGradesReceived,

      defineProject,
      {
        $sort: {
          order: 1,
        },
      },
    ] as PipelineStage[]).exec();
  } catch (e) {
    console.error("Failed to fetch guides:", e);
    throw e;
  }
}
