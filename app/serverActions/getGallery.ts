"use server";

import mongoose, { PipelineStage, Types } from "mongoose";
import { connectToDatabase } from "./mongoose-connector";
import { parseTopics } from "utils/galleryTopics";
import { Review, Vote } from "models/review";
import { ModuleType } from "models/guide";
import { isoDate } from "utils/serialization";

type ModuleSummary = Pick<ModuleType, "title" | "number">;

type GalleryAggregateResult = {
  returnId: Types.ObjectId;
  title: string;
  description: string;
  studentName: string;
  module: ModuleSummary;
  guideTitle: string;
  recommendationCount: number;
  pictureUrl?: string;
  projectUrl?: string;
  liveVersion?: string;
  topicsList?: string;
  createdAt?: Date | string;
};

export type GalleryItem = {
  returnId: string;
  title: string;
  description: string;
  studentName: string;
  module: ModuleSummary;
  guideTitle: string;
  recommendationCount: number;
  returnImage: string | null;
  returnGif: string | null;
  returnUrl: string | null;
  projectUrl: string | null;
  liveVersion: string | null;
  topics: string[];
  createdAt: string;
};

/**
 * Starts from the gallery votes, not from the returns: only a few reviews
 * recommend a return for the gallery, while the old pipeline joined the
 * reviews of every return ever handed in before throwing most of them away.
 */
const buildPipeline = (limit?: number): PipelineStage[] => {
  const pipeline: PipelineStage[] = [
    { $match: { vote: Vote.RECOMMEND_TO_GALLERY } },
    { $group: { _id: "$return", recommendationCount: { $sum: 1 } } },
    {
      $lookup: {
        from: "returns",
        localField: "_id",
        foreignField: "_id",
        as: "return",
      },
    },
    { $unwind: "$return" },
    {
      $lookup: {
        from: "guides",
        localField: "return.guide",
        foreignField: "_id",
        as: "guide",
      },
    },
    { $unwind: "$guide" },
    {
      $lookup: {
        from: "users",
        localField: "return.owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    { $unwind: "$owner" },
    {
      $project: {
        _id: 0,
        returnId: "$_id",
        title: "$return.projectName",
        description: "$return.comment",
        studentName: "$owner.name",
        module: {
          title: "$guide.module.title",
          number: "$guide.module.number",
        },
        guideTitle: "$guide.title",
        topicsList: "$guide.topicsList",
        recommendationCount: 1,
        pictureUrl: "$return.pictureUrl",
        projectUrl: "$return.projectUrl",
        liveVersion: "$return.liveVersion",
        createdAt: "$return.createdAt",
      },
    },
    {
      $sort: {
        recommendationCount: -1,
        createdAt: -1,
        returnId: 1,
      },
    },
  ];

  if (limit) {
    pipeline.push({ $limit: limit });
  }

  return pipeline;
};

const parseMedia = (url?: string): { image: string | null; gif: string | null } => {
  if (!url) {
    return { image: null, gif: null };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { image: null, gif: null };
  }

  return trimmed.toLowerCase().endsWith(".gif")
    ? { image: null, gif: trimmed }
    : { image: trimmed, gif: null };
};


const mapAggregateToItem = (doc: GalleryAggregateResult): GalleryItem => {
  const { image, gif } = parseMedia(doc.pictureUrl);

  return {
    returnId: doc.returnId.toString(),
    title: doc.title,
    description: doc.description,
    studentName: doc.studentName,
    module: doc.module,
    guideTitle: doc.guideTitle,
    recommendationCount: doc.recommendationCount,
    returnImage: image,
    returnGif: gif,
    returnUrl: doc.liveVersion ?? doc.projectUrl ?? null,
    projectUrl: doc.projectUrl ?? null,
    liveVersion: doc.liveVersion ?? null,
    topics: parseTopics(doc.topicsList),
    // The aggregate skips mongoose casting, so a hand-imported return may carry
    // a string or no date at all. "" (not the epoch) keeps it out of the year filter.
    createdAt: doc.createdAt ? isoDate(doc.createdAt) : "",
  };
};

export async function getGalleryItems(): Promise<GalleryItem[]> {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB not connected. Skipping gallery fetch.");
      return [];
    }

    const pipeline = buildPipeline(4);
    const results = await Review.aggregate<GalleryAggregateResult>(pipeline);

    return results.map(mapAggregateToItem);
  } catch (error) {
    if (error instanceof Error && error.name === "MongoNotConnectedError") {
      console.warn("MongoDB connection unavailable during gallery fetch. Returning empty list.");
      return [];
    }
    console.error("Failed to fetch gallery items:", error);
    return [];
  }
}

export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  try {
    await connectToDatabase();
    if (mongoose.connection.readyState !== 1) {
      console.warn("MongoDB not connected. Skipping gallery fetch.");
      return [];
    }

    const pipeline = buildPipeline();
    const results = await Review.aggregate<GalleryAggregateResult>(pipeline);

    return results.map(mapAggregateToItem);
  } catch (error) {
    if (error instanceof Error && error.name === "MongoNotConnectedError") {
      console.warn("MongoDB connection unavailable during gallery fetch. Returning empty list.");
      return [];
    }
    console.error("Failed to fetch all gallery items:", error);
    return [];
  }
}
