"use server";

import { auth } from "../../auth";
import { Review
 } from "../models/review";
import { Return } from "../models/return";
import { User } from "../models/user";
import { Guide } from "../models/guide";
import { safeSerialize } from "../utils/serialization";
import { connectToDatabase } from "./mongoose-connector";

export type UngradedReviewWithDetails = {
  _id: string;
  comment: string;
  vote: string;
  createdAt: Date;
  guide: {
    _id: string;
    title: string;
  };
  return: {
    _id: string;
    projectName: string;
    projectUrl: string;
    liveVersion: string;
  };
  reviewer: {
    _id: string;
    name: string;
  };
  returnOwner: {
    _id: string;
    name: string;
  };
};

export async function getUngradedReviews(): Promise<UngradedReviewWithDetails[]> {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  // Only teachers can access this
  if (session.user.role !== "teacher") {
    return [];
  }

  try {
    await connectToDatabase();

    // Find all reviews without a grade
    const ungradedReviews = await Review.find({
      $or: [
        { grade: null },
        { grade: { $exists: false } }
      ]
    }).sort({ createdAt: 1 }); // Oldest first

    // Fetch related data for each review
    const reviewsWithDetails: UngradedReviewWithDetails[] = [];

    for (const review of ungradedReviews) {
      const [guide, returnDoc, reviewer] = await Promise.all([
        Guide.findById(review.guide),
        Return.findById(review.return),
        User.findById(review.owner)
      ]);

      if (!guide || !returnDoc || !reviewer) continue;

      const returnOwner = await User.findById(returnDoc.owner);
      if (!returnOwner) continue;

      reviewsWithDetails.push({
        _id: review._id.toString(),
        comment: review.comment,
        vote: review.vote,
        createdAt: review.createdAt,
        guide: {
          _id: guide._id.toString(),
          title: guide.title,
        },
        return: {
          _id: returnDoc._id.toString(),
          projectName: returnDoc.projectName,
          projectUrl: returnDoc.projectUrl,
          liveVersion: returnDoc.liveVersion,
        },
        reviewer: {
          _id: reviewer._id.toString(),
          name: reviewer.name,
        },
        returnOwner: {
          _id: returnOwner._id.toString(),
          name: returnOwner.name,
        },
      });
    }

    return safeSerialize(reviewsWithDetails);
  } catch (error) {
    console.error("[getUngradedReviews] Error:", error);
    return [];
  }
}
