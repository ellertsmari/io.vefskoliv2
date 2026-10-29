import { GuideType } from "models/guide";
import { GuideInfo } from "types/guideTypes";

// Create a simplified guide info structure for public access
export const createPublicGuideInfo = (guide: GuideType): GuideInfo => {
  return {
    _id: guide._id,
    submissionType: guide.submissionType,
    title: guide.title,
    description: guide.description,
    category: guide.category,
    discipline: (guide.discipline as "code" | "design") || undefined,
    isSpecialty: guide.isSpecialty ?? undefined,
    order: guide.order,
    module: guide.module,
    // Add empty arrays for user-specific fields that the component expects
    returnsSubmitted: [],
    reviewsReceived: [],
    availableForReview: [],
    reviewsGiven: [],
    gradesReceived: [],
    gradesGiven: [],
  };
};

