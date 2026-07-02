// Shared constants for the group-work feature (projects, formation, evaluations).
// Option lists are adapted from the SustainableIsland group formation flow.

export const AMBITION_OPTIONS = ["Basics", "In Between", "Ambitious"] as const;

export const FOCUS_OPTIONS = [
  "Design",
  "Frontend",
  "Backend",
  "Management",
] as const;

export const TECH_STACK_OPTIONS = [
  "React",
  "TypeScript",
  "Express",
  "NextJS",
  "NodeJS",
  "Figma",
  "MySQL",
  "MongoDB",
  "Supabase",
  "PostgreSQL",
] as const;

export type GroupProjectStatus = "formation" | "active" | "archived";

export const PROJECT_STATUSES: GroupProjectStatus[] = [
  "formation",
  "active",
  "archived",
];

export const PROJECT_STATUS_LABELS: Record<GroupProjectStatus, string> = {
  formation: "Formation",
  active: "Active",
  archived: "Archived",
};

export const TEAM_LINK_KEYS = [
  "github",
  "figma",
  "figjam",
  "website",
  "backend",
] as const;

export type TeamLinkKey = (typeof TEAM_LINK_KEYS)[number];

export const TEAM_LINK_LABELS: Record<TeamLinkKey, string> = {
  github: "GitHub",
  figma: "Figma",
  figjam: "FigJam",
  website: "Live website",
  backend: "Backend",
};

export const MAX_TEAM_IMAGES = 3;

// Peer evaluation: students score each teammate on two axes, -2..+2.
export const PEER_SCORE_VALUES = [-2, -1, 0, 1, 2] as const;

export type PeerScoreInfo = { label: string; tooltip: string; emoji: string };

export const CONTRIBUTION_SCORES: Record<number, PeerScoreInfo> = {
  [-2]: { label: "No work", tooltip: "Did no work at all", emoji: "🚫" },
  [-1]: {
    label: "Less than others",
    tooltip: "Did less than others in the group",
    emoji: "📉",
  },
  [0]: {
    label: "Average",
    tooltip: "Average contribution compared to the rest of the group",
    emoji: "⚖️",
  },
  [1]: {
    label: "More than others",
    tooltip: "Did more than most others in the group",
    emoji: "📈",
  },
  [2]: { label: "Most of the work", tooltip: "Did most of the work", emoji: "🚀" },
};

export const TEAMBUILDING_SCORES: Record<number, PeerScoreInfo> = {
  [-2]: {
    label: "No communication",
    tooltip: "Did not communicate or help others at all",
    emoji: "🔇",
  },
  [-1]: {
    label: "Rarely helped",
    tooltip: "Communicated less than others and rarely helped teammates",
    emoji: "😶",
  },
  [0]: {
    label: "Average",
    tooltip: "Communicated and helped others an average amount",
    emoji: "🤝",
  },
  [1]: {
    label: "Actively helped",
    tooltip: "Actively communicated and helped others more than most",
    emoji: "💬",
  },
  [2]: {
    label: "Kept team together",
    tooltip:
      "Kept the team together, made sure everyone was included and supported",
    emoji: "🫂",
  },
};

// Team (presentation) evaluation: 0..10 per category.
export const EVALUATION_CATEGORIES = ["product", "presentation", "qa"] as const;

export type EvaluationCategory = (typeof EVALUATION_CATEGORIES)[number];

export const EVALUATION_CATEGORY_LABELS: Record<EvaluationCategory, string> = {
  product: "Product",
  presentation: "Presentation",
  qa: "Q&A",
};

export const EVALUATION_MIN_SCORE = 0;
export const EVALUATION_MAX_SCORE = 10;
