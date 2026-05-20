import { GuideType } from "models/guide";
import { Module, GuideInfo } from "types/guideTypes";
import { extractModuleNumber } from "utils/moduleUtils";

// Create a simplified guide info structure for public access
export const createPublicGuideInfo = (guide: GuideType): GuideInfo => {
  return {
    _id: guide._id,
    title: guide.title,
    description: guide.description,
    category: guide.category,
    order: guide.order,
    module: guide.module,
    // Add empty arrays for user-specific fields that the component expects
    returnsSubmitted: [],
    reviewsReceived: [],
    availableForReview: [],
    reviewsGiven: [],
    gradesReceived: [],
    availableToGrade: [],
    gradesGiven: [],
  };
};

export const fetchPublicModules = async (guides: GuideType[]) => {
  return guides
    .reduce((acc: Module[], guideToCheck) => {
      const moduleNumber = extractModuleNumber(guideToCheck.module.title);
      if (!acc.some((existingGuide) => moduleNumber === existingGuide.number)) {
        acc.push({
          title: guideToCheck.module.title,
          number: moduleNumber,
        });
      }
      return acc;
    }, [] as { title: string; number: number }[])
    .sort((a, b) => a.number - b.number);
};
