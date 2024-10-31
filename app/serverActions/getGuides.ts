"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../clientActions/mongoose-connector";
import { Guide } from "models/guide";
import { PipelineStage } from "mongoose";
import { GuideInfo } from "types/guideTypes";

// grab user's submitted returns
const lookupReturnsSubmitted = (userId: ObjectId): PipelineStage => {
  return {
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
};

// grab feedback given by user
const lookupFeedbackGiven = (userId: ObjectId): PipelineStage => {
  return {
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
        {
          $lookup: {
            from: "returns",
            localField: "return",
            foreignField: "_id",
            as: "associatedReturn",
          },
        },
        { $unwind: "$associatedReturn" },
      ],
      as: "feedbackGiven",
    },
  };
};

// grab grades received from others
const addGradesReceived = (): PipelineStage => {
  return {
    $addFields: {
      gradesReceived: {
        $filter: {
          input: "$feedbackGiven",
          as: "feedback",
          cond: { $ne: [{ $ifNull: ["$$feedback.grade", null] }, null] }, // Filter where grade is null
        },
      },
      as: "gradesReceived",
    },
  };
};

// grab returns available for reviewing by user
const lookupAvailableForFeedback = (userId: ObjectId): PipelineStage => {
  return {
    $lookup: {
      from: "returns",
      let: { guideId: "$_id", feedbackGivenReturns: "$feedbackGiven.return" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] }, // Ensure the guide matches
                { $ne: ["$owner", userId] }, // Exclude returns from the user
                { $not: { $in: ["$_id", "$$feedbackGivenReturns"] } }, // Exclude returns user has already given feedback on
              ],
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
};

// TODO - CHECK HOW MANY TIMES THE RETURN HAS BEEN GIVEN FEEDBACK
// Do here or do it in the client when enriching?

// grab feedbackReceived from others
const lookupFeedbackReceived = (userId: ObjectId): PipelineStage => {
  return {
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
            as: "associatedReturn",
          },
        },
        // Unwind the array, so we can easily access the owner field
        {
          $unwind: "$associatedReturn",
        },
        // Filter by guide and owner
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $ne: ["$owner", userId] },
                { $eq: ["$associatedReturn.owner", userId] },
              ],
            },
          },
        },
      ],
      as: "feedbackReceived",
    },
  };
};

// grab feedback available for reviewing by user
const addAvailableToGrade = (): PipelineStage => {
  return {
    $addFields: {
      availableToGrade: {
        $filter: {
          input: "$feedbackReceived",
          as: "feedback",
          cond: { $eq: [{ $ifNull: ["$$feedback.grade", null] }, null] }, // Filter where grade is null
        },
      },
    },
  };
};

// grab grades given by user
const addGradesGiven = (): PipelineStage => {
  return {
    $addFields: {
      gradesGiven: {
        $filter: {
          input: "$feedbackReceived",
          as: "feedback",
          cond: { $ne: [{ $ifNull: ["$$feedback.grade", null] }, null] }, // Filter where grade exists
        },
      },
    },
  };
};

export const getGuidesPipelines = async (userId: ObjectId): Promise<PipelineStage[]> => {
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

      // grades received by others on feedback given by this user
      gradesReceived: 1,

      // reviewing others' feedback
      gradesGiven: 1,
      availableToGrade: 1,
    },
  };
  return [
    lookupReturnsSubmitted(userId),
    lookupFeedbackGiven(userId),
    addGradesReceived(),
    lookupAvailableForFeedback(userId),
    lookupFeedbackReceived(userId),
    addGradesGiven(),
    addAvailableToGrade(),
    defineProject,
    {
      $sort: {
        order: 1,
      },
    },
  ];
};

export async function getGuides(
  userIdString: string
): Promise<GuideInfo[] | null> {
  if (!userIdString) return null;

  await connectToDatabase();
  const userId = new ObjectId(userIdString);
  const pipeline = await getGuidesPipelines(userId);

  try {
    return await Guide.aggregate(pipeline).exec();
  } catch (e) {
    console.error("Failed to fetch guides:", e);
    throw e;
  }
}
