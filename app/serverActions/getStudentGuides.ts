"use server";

import { getGuides } from "./getGuides";
import { extendGuides } from "utils/guideUtils";
import { safeSerialize } from "utils/serialization";
import { ExtendedGuideInfo } from "types/guideTypes";

export const getStudentGuides = async (userId: string): Promise<ExtendedGuideInfo[]> => {
  try {
    const fetchedGuides = await getGuides(userId);
    
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