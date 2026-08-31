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

// When and where a student wants to work. Teachers use these to avoid teams
// whose members can never actually meet — a daytime-at-school student paired
// with an evenings-from-home one rarely works out.
export const SCHEDULE_OPTIONS = [
  "Daytime only",
  "Evenings only",
  "Partly daytime, partly evenings",
] as const;

export const LOCATION_OPTIONS = [
  "At school",
  "At home",
  "Partly at school, partly at home",
] as const;

export type ScheduleOption = (typeof SCHEDULE_OPTIONS)[number];
export type LocationOption = (typeof LOCATION_OPTIONS)[number];

export const SCHEDULE_ICONS: Record<string, string> = {
  "Daytime only": "ph:sun-bold",
  "Evenings only": "ph:moon-bold",
  "Partly daytime, partly evenings": "ph:sun-horizon-bold",
};

export const LOCATION_ICONS: Record<string, string> = {
  "At school": "mdi:school-outline",
  "At home": "mdi:home-outline",
  "Partly at school, partly at home": "uil:arrows-h",
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

// The stored value stays "archived" — it is the enum on every project document
// ever written — but nothing user-facing says so any more: the state means the
// project is over, not that it is shut. Evaluations are still accepted, for
// whoever is late.
export const PROJECT_STATUS_LABELS: Record<GroupProjectStatus, string> = {
  formation: "Formation",
  active: "Active",
  archived: "Completed",
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

// How many pieces of feedback a team may publish on its showcase page. A
// handful reads as a highlight; the whole pile reads as a transcript.
export const MAX_SHOWCASE_QUOTES = 6;

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

// Peer evaluation is a *relative* judgement: every score says how one member
// did compared with the rest of the team, so a team cannot be rated above its
// own average. The scores one evaluator gives on one axis must therefore add
// up to zero or less — marking somebody up is paid for by marking somebody
// else down. Rating the whole team down stays allowed: the failure mode this
// guards against is inflation ("everyone was great, me most of all"), and a
// student who marks everybody but themselves down is what the teacher's
// review of the result is for.
export const PEER_BALANCE_MAX = 0;

// The confirmed result a teacher records per student sits on the same scale as
// the scores it summarizes, in tenths — one figure per axis.
export const PEER_RESULT_MIN = -2;
export const PEER_RESULT_MAX = 2;
export const PEER_RESULT_STEP = 0.1;

/**
 * How the confirmed peer figures turn a team's project grade into one
 * student's individual grade — the calculation Vefskólinn already runs in the
 * SustainableIsland LMS (`API/Controllers/peerEvalController.js`), kept
 * identical on purpose so the two courses grade the same way:
 *
 *     P     = (contribution + 2) * (teambuilding + 2) - 4     // -4 … +12
 *     scale = P >= 0 ? 0.025 : 0.175                          // +30% / -70%
 *     grade = (P * scale + 1) * projectGrade
 *
 * The two axes multiply rather than average, which is the point: somebody who
 * carried the code but was impossible to work with (+2 and -2) lands on P = -4
 * and keeps 30% of the grade, where averaging the axes would have called them
 * exactly average and changed nothing.
 *
 * Only teacher-confirmed figures ever reach this function. What the team wrote
 * is advice for the teacher setting them.
 */
export const PEER_BOOST_SCALE = 0.025;
export const PEER_PENALTY_SCALE = 0.175;

export function peerGradeFactor(
  contribution: number,
  teambuilding: number
): number {
  const p = (contribution + 2) * (teambuilding + 2) - 4;
  return p * (p >= 0 ? PEER_BOOST_SCALE : PEER_PENALTY_SCALE) + 1;
}

/**
 * The team's project grade: the mean of its rubric rows, each already blended
 * 80/20 between the panel and the student audience. Rows nobody scored are
 * left out rather than counted as zero.
 */
export function projectGradeFromScores(
  rubric: RubricItem[] | null | undefined,
  scores: Record<string, { avg: number }> | null | undefined
): number | null {
  if (!scores) return null;
  const scored = rubricForProject(rubric)
    .map((item) => scores[item.key]?.avg)
    .filter((avg): avg is number => typeof avg === "number");
  if (scored.length === 0) return null;
  return scored.reduce((sum, avg) => sum + avg, 0) / scored.length;
}

/**
 * A finished grade, on the rubric's own 0–10 scale.
 *
 * The clamp happens here and nowhere earlier. Capping each rubric row first
 * would quietly take the boost away from a team that scored 10 on one row and
 * middling on the rest — the student would lose the credit on the perfect row
 * and keep the shortfall everywhere else — so rows stay uncapped and only the
 * result is held to 10.
 */
export function clampGrade(value: number): number {
  return round1(Math.min(EVALUATION_MAX_SCORE, Math.max(0, value)));
}

/** One decimal place — the precision every peer/team average is shown at. */
export const round1 = (value: number) => Math.round(value * 10) / 10;

export const PEER_AXIS_LABELS = {
  contribution: "Contribution",
  teambuilding: "Teamwork",
} as const;

export type PeerAxis = keyof typeof PEER_AXIS_LABELS;

/**
 * Running total of one axis. Unanswered scores count as zero so the form can
 * show a live balance while it is still being filled in.
 */
export const peerBalance = (scores: (number | null | undefined)[]): number =>
  scores.reduce<number>((total, score) => total + (score ?? 0), 0);

/** What is wrong with one axis' balance, or null when it is within budget. */
export function peerBalanceMessage(
  axis: PeerAxis,
  balance: number
): string | null {
  if (balance <= PEER_BALANCE_MAX) return null;
  const points = balance === 1 ? "1 point" : `${balance} points`;
  return `${PEER_AXIS_LABELS[axis]} scores add up to +${balance}. A team cannot be rated above its own average — take ${points} back.`;
}

export type PeerEvaluationInput = {
  targetId: string;
  contributionScore: number;
  teambuildingScore: number;
};

/**
 * Cross-field rules for one student's peer evaluation: every member of the
 * team is scored exactly once, the evaluator included, and neither axis adds
 * up to more than zero. Returns an error message, or null when valid.
 *
 * Shared by the form and the server action, so both say the same thing and the
 * rule holds where it counts rather than only where it is displayed.
 */
export function validatePeerEvaluationSubmission({
  entries,
  memberIds,
}: {
  entries: PeerEvaluationInput[];
  memberIds: string[];
}): string | null {
  const members = new Set(memberIds);
  const scored = new Set<string>();
  for (const entry of entries) {
    if (scored.has(entry.targetId)) {
      return "Give each teammate a single score, not several";
    }
    scored.add(entry.targetId);
    if (!members.has(entry.targetId)) {
      return "You can only evaluate members of your own team";
    }
  }
  if (memberIds.some((id) => !scored.has(id))) {
    return "Evaluate everyone on the team, yourself included";
  }
  return (
    peerBalanceMessage(
      "contribution",
      peerBalance(entries.map((entry) => entry.contributionScore))
    ) ??
    peerBalanceMessage(
      "teambuilding",
      peerBalance(entries.map((entry) => entry.teambuildingScore))
    )
  );
}

/**
 * How much of a team's score comes from the panel (teachers and invited
 * industry judges) rather than the student audience. Per project, because it
 * changes over the course: in Module 1 the students are two weeks in and do
 * not feel ready to put a number on each other's work — the point of them
 * scoring at all is the written feedback and getting used to the exercise — so
 * that project runs at 100/0. By the later modules they are comfortable owning
 * a fifth of the grade, which is what the project documents describe.
 */
export const DEFAULT_PANEL_WEIGHT = 0.8;
export const PANEL_WEIGHT_PRESETS = [1, 0.8, 0.7] as const;

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

/**
 * A stable key for a new rubric row, derived from its title.
 *
 * Keys are what stored TeamEvaluation documents point at, so once a row has
 * been scored its key must never change — the editor generates one when the
 * row is created and freezes it from then on. `taken` keeps a new row from
 * colliding with an existing one (or with the reserved overall-comment key).
 */
export function rubricKeyFromTitle(
  title: string,
  taken: Iterable<string> = []
): string {
  const base =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "row";
  const used = new Set([...taken, OVERALL_CATEGORY]);
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
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
