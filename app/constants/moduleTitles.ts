export const MODULE_TITLES = [
  "0 - Preparation",
  "1 - Introductory Course",
  "2 - Community & Networking", 
  "3 - The fundamentals",
  "4 - Connecting to the World",
  "5 - Back-end & Infrastructure",
  "6 - Growing complexity",
  "7 - Exploration"
] as const;

export type ModuleTitle = typeof MODULE_TITLES[number];