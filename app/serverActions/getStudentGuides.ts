"use server";

import { loadStudentGuideBoard } from "./guideBoard";
import { ExtendedGuideInfo } from "types/guideTypes";

/**
 * A student's guides with the derived statuses the UI shows. The id is
 * honoured for teachers only, everyone else gets their own guides (getGuides
 * enforces that). This is imported by a client component (the reports page),
 * so it is callable from any browser with any argument.
 */
export const getStudentGuides = async (
  userId?: string
): Promise<ExtendedGuideInfo[]> => {
  try {
    return (await loadStudentGuideBoard(userId)).guides;
  } catch (error) {
    console.error("Error in getStudentGuides:", error);
    return [];
  }
};
