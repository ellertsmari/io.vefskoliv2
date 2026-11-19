
"use server";

import { auth } from "../../../auth";
import { Types } from "mongoose";
import { Portfolio } from "models/portfolio";
import type { PortfolioContent } from "types/portfolioTypes";

import {
  type ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  success,
} from "utils/errors";

// Browser-friendly content with an ISO date string
type EditorContent = Omit<PortfolioContent, "availability"> & {
  availability: Omit<
    PortfolioContent["availability"],
    "availableFrom"
  > & {
    availableFrom: string;
  };
};

export type MyPortfolioData = {
  content: EditorContent;
  slug: string;
  visibility: "public" | "hidden";
  publishedAt: string;
  updatedAt: string;
};

// Load the logged-in student's stored portfolio
export async function getMyPortfolio(): Promise<
  ActionResult<MyPortfolioData | null>
> {
  // 1. Check the student's session
  const session = await auth();
  const studentId = session?.user?.id;

  if (!studentId) {
    return failure(ErrorMessages.NOT_LOGGED_IN);
  }

  if (!Types.ObjectId.isValid(studentId)) {
    return failure(ErrorMessages.NOT_AUTHORIZED);
  }

  try {
    // 2. Find the student's portfolio in MongoDB
    const portfolio = await Portfolio.findOne({
      studentId: new Types.ObjectId(studentId),
    })
      .select("content slug visibility publishedAt updatedAt")
      .lean<{
        content: PortfolioContent;
        slug: string;
        visibility: "public" | "hidden";
        publishedAt: Date;
        updatedAt: Date;
      } | null>();

    // 3. No published portfolio yet
    if (!portfolio) {
      return success(null);
    }

    // 4. Return serializable data for the editor
    return success({
      content: {
        ...portfolio.content,
        availability: {
          ...portfolio.content.availability,
          availableFrom:
            portfolio.content.availability.availableFrom.toISOString(),
        },
      },
      slug: portfolio.slug,
      visibility: portfolio.visibility,
      publishedAt: portfolio.publishedAt.toISOString(),
      updatedAt: portfolio.updatedAt.toISOString(),
    });
  } catch (error) {
    return handleActionError(
      "getMyPortfolio",
      error,
      ErrorMessages.FAILED_TO_FETCH("portfolio")
    );
  }
}
