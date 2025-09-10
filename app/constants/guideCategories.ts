export const GUIDE_CATEGORIES = [
  "code",
  "design", 
  "speciality code",
  "speciality design"
] as const;

export type GuideCategory = typeof GUIDE_CATEGORIES[number];