"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "./mongoose-connector";
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

// grab reviews given by user
const lookupReviewsGiven = (userId: ObjectId): PipelineStage => {
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
      as: "reviewsGiven",
    },
  };
};

// grab grades received from others
const addGradesReceived = (): PipelineStage => {
  return {
    $addFields: {
      gradesReceived: {
        $filter: {
          input: "$reviewsGiven",
          as: "review",
          cond: { $ne: [{ $ifNull: ["$$review.grade", null] }, null] }, // Filter where grade is not null
        },
      },
      as: "gradesReceived",
    },
  };
};

// grab the latest return from each user which has received less than 2 reviews
const lookupAvailableForReview = (userId: ObjectId): PipelineStage => {
  return {
    $lookup: {
      from: "returns",
      let: { guideId: "$_id", reviewsGivenReturns: "$reviewsGiven.return" }, // Guide ID from the current document
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] },
                { $ne: ["$owner", userId] }, // exclude the user
                { $not: { $in: ["$_id", "$$reviewsGivenReturns"] } }, // Exclude returns user has already reviewed
              ],
            },
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort returns by the createdAt field in descending order
        },
        {
          $group: {
            _id: "$owner", // Group by the owner of the return
            mostRecentReturn: { $first: "$$ROOT" }, // Get the most recent return for each owner
          },
        },
        {
          $replaceRoot: { newRoot: "$mostRecentReturn" }, // Replace the root with the most recent return
        },
        {
          $lookup: {
            from: "reviews", // Look up reviews for the return
            let: { returnId: "$_id" }, // Pass the return ID to the review lookup
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$return", "$$returnId"], // Match reviews by return ID
                  },
                },
              },
            ],
            as: "associatedReviews", // The reviews associated with this return
          },
        },
        {
          $addFields: {
            associatedReviewCount: { $size: "$associatedReviews" }, // Count the number of associated reviews
          },
        },

        {
          $project: {
            associatedReviews: 0, // Exclude the associatedReviews field
          },
        },
        {
          $sort: {
            associatedReviewCount: 1, // Primary: fewest reviews first
            createdAt: 1, // Secondary: oldest first for deterministic ordering
            _id: 1, // Tertiary: by _id for absolute consistency
          },
        },
      ],
      as: "availableForReview", // Store the filtered returns in this field
    },
  };
};

// grab reviewsReceived from others
const lookupReviewsReceived = (userId: ObjectId): PipelineStage => {
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

        {
          $sort: {
            createdAt: -1, // Sort by createdAt in descending order
          },
        },
      ],
      as: "reviewsReceived",
    },
  };
};

// grab reviews available for grading by user (reviews on OTHER users' returns, for neutral grading)
const addAvailableToGrade = (userId: ObjectId): PipelineStage => {
  return {
    $lookup: {
      from: "reviews",
      let: { userId: userId, guideId: "$_id" },
      pipeline: [
        // Find reviews on this guide that haven't been graded yet
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] }, // For this specific guide
                { $eq: [{ $ifNull: ["$grade", null] }, null] }, // No grade given yet
                { $ne: ["$owner", "$$userId"] }, // Not the user's own review (they didn't write it)
              ],
            },
          },
        },
        // Join with returns to get project info
        {
          $lookup: {
            from: "returns",
            localField: "return",
            foreignField: "_id",
            as: "associatedReturn",
          },
        },
        { $unwind: "$associatedReturn" },
        // Only include reviews on OTHER users' projects (not reviews on the user's own returns)
        // This ensures neutral grading - users grade reviews given to others, not to themselves
        {
          $match: {
            $expr: {
              $ne: ["$associatedReturn.owner", "$$userId"],
            },
          },
        },
        // Sort by creation date (oldest first) for fairness
        { $sort: { createdAt: 1 } },
        // Limit to prevent overwhelming the user
        { $limit: 10 },
      ],
      as: "availableToGrade",
    },
  };
};

// grab grades given by user (reviews that this user has graded)
const lookupGradesGiven = (userId: ObjectId): PipelineStage => {
  return {
    $lookup: {
      from: "reviews",
      let: { guideId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$guide", "$$guideId"] }, // For this specific guide
                { $eq: ["$gradedBy", userId] }, // Graded by this user
                { $ne: [{ $ifNull: ["$grade", null] }, null] }, // Has a grade
              ],
            },
          },
        },
      ],
      as: "gradesGiven",
    },
  };
};

const getGuidesPipelines = (userId: ObjectId): PipelineStage[] => {
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
      reviewsReceived: 1,

      // giving reviews on others' returns
      availableForReview: 1,
      reviewsGiven: 1,

      // grades received by others on reviews given by this user
      gradesReceived: 1,

      // grading others' reviews
      gradesGiven: 1,
      availableToGrade: 1,
    },
  };
  return [
    lookupReturnsSubmitted(userId),
    lookupReviewsGiven(userId),
    addGradesReceived(),
    lookupReviewsReceived(userId),
    lookupGradesGiven(userId),
    addAvailableToGrade(userId),
    lookupAvailableForReview(userId),
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

  try {
    await connectToDatabase();

    const userId = new ObjectId(userIdString);
    const pipeline = getGuidesPipelines(userId);

    const result = await Guide.aggregate(pipeline).exec();

    // Serialize MongoDB documents to plain objects for client components
    const serializedResult = JSON.parse(JSON.stringify(result));

    return serializedResult as GuideInfo[];
  } catch (e) {
    const error = e instanceof Error ? e : new Error(String(e));
    console.error("[getGuides] Failed to fetch guides:", error.message);
    throw error;
  }
}
