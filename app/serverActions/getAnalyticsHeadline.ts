"use server";

import { auth } from "../../auth";
import { getAnalyticsHeadline as readHeadline } from "../lib/analytics/stats";
import type { AnalyticsHeadline } from "types/analyticsTypes";
import { hasTeacherPermissions } from "utils/userUtils";

/**
 * Last week's public visitors, for the analytics card on the teacher home
 * page. Fetched from the client like the grading count, so a slow database
 * delays one line of text rather than the whole dashboard. Null for anyone
 * who isn't a teacher, and when the numbers can't be read.
 */
export async function getAnalyticsHeadline(): Promise<AnalyticsHeadline | null> {
  const session = await auth();
  if (!hasTeacherPermissions(session)) return null;
  try {
    return await readHeadline();
  } catch (error) {
    console.error("Failed to read the analytics headline:", error);
    return null;
  }
}
