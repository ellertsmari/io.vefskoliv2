export const GUIDE_CATEGORIES = [
  "code",
  "design", 
  "codeSpeciality",
  "designSpeciality"
] as const;

export type GuideCategory = typeof GUIDE_CATEGORIES[number];