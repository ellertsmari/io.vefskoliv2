"use server";

import { auth } from "../../auth";
import { getGuides } from "./getGuides";
import { extendGuides } from "utils/guideUtils";
import { safeSerialize } from "utils/serialization";
import { ExtendedGuideInfo } from "types/guideTypes";
import { hasTeacherPermissions } from "utils/userUtils";

/**
 * `getGuides` plus the derived statuses the UI shows. Same rule as there: the
 * id is honoured for teachers only, everyone else gets their own guides. This
 * is imported by a client component (the reports page), so it is callable
 * from any browser with any argument.
 */
export const getStudentGuides = async (
  userId?: string
): Promise<ExtendedGuideInfo[]> => {
  const session = await auth();
  if (!session?.user?.id) return [];

  const targetId =
    hasTeacherPermissions(session) && userId ? userId : session.user.id;

  try {
    const fetchedGuides = await getGuides(targetId);
    
    if (!fetchedGuides || fetchedGuides.length === 0) {
      return [];
    }

    const extended = await extendGuides(fetchedGuides);
    
    // Properly serialize all the data before returning to client
    const serialized = safeSerialize(extended);
    
    return serialized as ExtendedGuideInfo[];
  } catch (error) {
    console.error("Error in getStudentGuides:", error);
    return [];
  }
};