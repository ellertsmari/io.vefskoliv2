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
  "HTML",
  "CSS",
  "Tailwind",
  "Styled Components",
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

export type TechStackOption = (typeof TECH_STACK_OPTIONS)[number];

// Iconify icon names (https://icon-sets.iconify.design), ported from the
// SustainableIsland group formation flow.
export const TECH_STACK_ICONS: Record<TechStackOption, string> = {
  HTML: "logos:html-5",
  CSS: "logos:css-3",
  Tailwind: "logos:tailwindcss-icon",
  "Styled Components": "skill-icons:styledcomponents",
  React: "logos:react",
  TypeScript: "logos:typescript-icon",
  Express: "logos:express",
  NextJS: "logos:nextjs-icon",
  NodeJS: "logos:nodejs-icon",
  Figma: "logos:figma",
  MySQL: "logos:mysql-icon",
  MongoDB: "logos:mongodb-icon",
  Supabase: "logos:supabase-icon",
  PostgreSQL: "logos:postgresql",
};

export const AMBITION_ICONS: Record<string, string> = {
  Basics: "tabler:book",
  "In Between": "uil:arrows-h",
  Ambitious: "ic:round-star",
};

export const FOCUS_ICONS: Record<string, string> = {
  Design: "mdi:design",
  Frontend: "bi:front",
  Backend: "bi:back",
  Management: "hugeicons:time-management",
};

// Modules that have a group project. Which stack choices make sense depends on
// how far into the programme the module is (derived from the guides taught in
// each module — e.g. Module 1 only covers HTML/CSS/Figma, React arrives in
// Module 4, back-end tech in Module 5).
export const GROUP_PROJECT_MODULES = [1, 3, 4, 5, 6] as const;

export const MODULE_TECH_STACK: Record<number, readonly TechStackOption[]> = {
  1: ["HTML", "CSS", "Figma"],
  3: ["HTML", "CSS", "Tailwind", "TypeScript", "Figma"],
  4: ["React", "TypeScript", "Tailwind", "Styled Components", "Figma"],
  5: [
    "NextJS",
    "NodeJS",
    "Express",
    "TypeScript",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "Supabase",
  ],
  6: [...TECH_STACK_OPTIONS],
};

/** Stack options students may pick for a project (all of them when the project has no module). */
export function techStackOptionsForModule(
  module: number | null | undefined
): readonly TechStackOption[] {
  if (module != null && MODULE_TECH_STACK[module]) {
    return MODULE_TECH_STACK[module];
  }
  return TECH_STACK_OPTIONS;
}

export type GroupProjectStatus = "formation" | "active" | "archived";

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

// Team images are uploaded via utils/imageUpload (browser-compressed data
// URLs stored inline) — they'll feed the future showcase page.
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
export const EVALUATION_MIN_SCORE = 0;
export const EVALUATION_MAX_SCORE = 10;

// Rubric rows are color coded by discipline, like in the project description
// docs: coding is one color, design another, and the general presentation
// rows (presentation, Q&A, organization…) a third.
export type RubricDiscipline = "design" | "code" | "general";

export type DisciplineMeta = {
  label: string;
  /** Accent color (borders, sliders, text). */
  color: string;
  /** Soft background for pills/cells. */
  background: string;
};

export const DISCIPLINE_META: Record<RubricDiscipline, DisciplineMeta> = {
  design: { label: "Design", color: "#c2255c", background: "#ffdeeb" },
  code: { label: "Coding", color: "#1971c2", background: "#d0ebff" },
  general: { label: "Presentation", color: "#e8590c", background: "#ffe8cc" },
};

/** Meta (label + colors) for a stored evaluation category key. */
export function disciplineMetaForCategory(
  rubric: RubricItem[] | null | undefined,
  key: string
): DisciplineMeta {
  const item = rubricForProject(rubric).find((entry) => entry.key === key);
  return DISCIPLINE_META[item?.discipline ?? "general"];
}

// Presentation slot scheduling: pick a start time between 09:00 and 16:00
// (24-hour clock); the end time follows from the presentation length. The
// default length per module comes from the presentation format in the docs
// (M1: 20 min, M3/M4/M5: 30 min, M6: 40 min).
export const PRESENTATION_DAY_START = "09:00";
export const PRESENTATION_DAY_END = "16:00";
export const PRESENTATION_START_STEP_MINUTES = 10;
export const DEFAULT_PRESENTATION_LENGTH = 30;

export const MODULE_PRESENTATION_LENGTH: Record<number, number> = {
  1: 20,
  3: 30,
  4: 30,
  5: 30,
  6: 40,
};

export function presentationLengthForModule(
  module: number | null | undefined
): number {
  return (
    (module != null && MODULE_PRESENTATION_LENGTH[module]) ||
    DEFAULT_PRESENTATION_LENGTH
  );
}

export const minutesFromTime = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const timeFromMinutes = (total: number): string => {
  const hours = String(Math.floor(total / 60)).padStart(2, "0");
  const minutes = String(total % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/** Selectable start times, 09:00–16:00 in 10-minute steps (24-hour clock). */
export function presentationStartOptions(): string[] {
  const options: string[] = [];
  const first = minutesFromTime(PRESENTATION_DAY_START);
  const last = minutesFromTime(PRESENTATION_DAY_END);
  for (
    let minute = first;
    minute <= last;
    minute += PRESENTATION_START_STEP_MINUTES
  ) {
    options.push(timeFromMinutes(minute));
  }
  return options;
}

// Per-project rubric: each item becomes one 0..10 category in the team
// evaluation. Projects without a rubric fall back to DEFAULT_RUBRIC.
export type RubricItem = {
  key: string;
  title: string;
  description: string;
  discipline?: RubricDiscipline;
};

export const DEFAULT_RUBRIC: RubricItem[] = [
  {
    key: "product",
    title: "Product",
    description: "How good is the final product?",
    discipline: "general",
  },
  {
    key: "presentation",
    title: "Presentation",
    description: "How clear and engaging was the presentation?",
    discipline: "general",
  },
  {
    key: "qa",
    title: "Q&A",
    description: "How well did the team answer questions?",
    discipline: "general",
  },
];

// The special category key for the free-form comment that applies to the
// whole evaluation rather than one rubric row. Stored without a score and
// excluded from averages.
export const OVERALL_CATEGORY = "overall";

// External judges pick what they came to judge. "all" judges everything;
// otherwise only their discipline plus the general rows are required and the
// other discipline becomes optional.
export const JUDGE_FOCUS_OPTIONS = ["all", "design", "code"] as const;
export type JudgeFocus = (typeof JUDGE_FOCUS_OPTIONS)[number];

export const JUDGE_FOCUS_LABELS: Record<JudgeFocus, string> = {
  all: "Everything",
  design: "Design",
  code: "Coding",
};

/** Rubric keys the evaluator must score. Everyone scores the general rows; a focused judge skips the other discipline. */
export function requiredRubricKeys(
  rubric: RubricItem[] | null | undefined,
  focus: JudgeFocus | null = null
): Set<string> {
  const items = rubricForProject(rubric);
  if (!focus || focus === "all") {
    return new Set(items.map((item) => item.key));
  }
  return new Set(
    items
      .filter((item) => (item.discipline ?? "general") !== disciplineOpposite(focus))
      .map((item) => item.key)
  );
}

const disciplineOpposite = (focus: "design" | "code"): RubricDiscipline =>
  focus === "design" ? "code" : "design";

/**
 * The rubric to evaluate against — the project's own, or the default.
 * The OVERALL_CATEGORY key is reserved for the score-less overall comment,
 * so a rubric row using it is ignored rather than colliding with it.
 */
export function rubricForProject(
  rubric: RubricItem[] | null | undefined
): RubricItem[] {
  const items = (rubric || []).filter(
    (item) => item.key !== OVERALL_CATEGORY
  );
  return items.length > 0 ? items : DEFAULT_RUBRIC;
}

/** Display label for a stored evaluation category key. */
export function categoryLabel(
  rubric: RubricItem[] | null | undefined,
  key: string
): string {
  if (key === OVERALL_CATEGORY) return "Overall comment";
  const item = rubricForProject(rubric).find((entry) => entry.key === key);
  return item?.title || key;
}
