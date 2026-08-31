import {
  GroupProjectStatus,
  JudgeFocus,
  RubricItem,
  TeamLinkKey,
} from "../app/constants/groupWork";

// Serialized (client-safe) shapes returned by the group server actions.

export type GroupMemberInfo = {
  _id: string;
  name: string;
  avatarUrl?: string;
};

export type TeamLinks = Record<TeamLinkKey, string>;

/**
 * What the signed-in viewer sees of their team's showcase consent: their own
 * answer, which is theirs alone to change, plus an anonymous tally. Nobody is
 * ever told who declined — and because a name is individual, nobody needs to
 * know: one person's answer never holds up anybody else's.
 */
export type ShowcaseConsentSummary = {
  myName: boolean;
  nameAgreed: number;
  memberCount: number;
};

export type SerializedTeam = {
  _id: string;
  project: string;
  name: string;
  members: GroupMemberInfo[];
  projectName: string;
  tagline: string;
  projectDescription: string;
  links: TeamLinks;
  coverImage: string;
  teamPhoto: string;
  logo: string;
  showcaseConsent: ShowcaseConsentSummary;
};

// Public showcase (no auth — students link these pages from portfolios/CVs)

/**
 * One card in the `/showcase` grid. Deliberately NOT the same shape as the
 * detail page: the grid renders only the cover and the logo, so carrying
 * `teamPhoto` here would ship every team's photo to every visitor without ever
 * painting it — a third of the payload, wasted, on the page that grows every
 * semester.
 */
export type ShowcaseCard = {
  _id: string;
  name: string;
  projectName: string;
  tagline: string;
  coverImage: string;
  logo: string;
  memberNames: string[];
};

/**
 * A published quote on the public showcase: the words only, never a score, and
 * attributed as much as the person who wrote it agreed to. Teachers are named,
 * judges only if they opted in, classmates never.
 */
export type ShowcaseQuote = {
  comment: string;
  attribution: string;
};

export type ShowcaseTeam = {
  _id: string;
  name: string;
  projectName: string;
  tagline: string;
  projectDescription: string;
  links: TeamLinks;
  coverImage: string;
  teamPhoto: string;
  logo: string;
  memberNames: string[];
  quotes: ShowcaseQuote[];
};

export type ShowcaseProject = {
  _id: string;
  title: string;
  module: number | null;
  startDate: string;
  endDate: string;
  teams: ShowcaseCard[];
};

/**
 * The showcase is scoped to one graduating year at a time. Without this the
 * grid queried every non-formation project ever run and rendered all of them
 * on one page, so its weight grew by a full cohort every year.
 */
export type ShowcaseIndex = {
  projects: ShowcaseProject[];
  /** Every year that has something to show, newest first. */
  years: number[];
  year: number | null;
};

export type ShowcaseTeamDetail = {
  team: ShowcaseTeam;
  project: { title: string; module: number | null; endDate: string };
};

export type SerializedPreference = {
  user: string;
  ambition: string;
  focus: string[];
  techStack: string[];
  schedule: string;
  location: string;
  about: string;
};

export type SerializedPresentationSlot = {
  team: string;
  startTime: string;
  endTime: string;
};

export type SerializedGroupProject = {
  _id: string;
  title: string;
  description: string;
  module: number | null;
  startDate: string;
  endDate: string;
  status: GroupProjectStatus;
  presentationDate: string | null;
  presentationLength: number | null;
  presentationSlots: SerializedPresentationSlot[];
  rubric: RubricItem[];
  peerEvalOpen: boolean;
  teamEvalOpen: boolean;
  /** Teachers have published the scores; written feedback does not wait for this. */
  gradesReleased: boolean;
  /**
   * True when `description` was withheld server-side because the viewer is a
   * student who hasn't completed their formation preferences yet. The brief is
   * the reward for filling in the form, so it never reaches the client until
   * then — hiding it in the UI alone would still ship it in the payload.
   */
  descriptionLocked: boolean;
};

export type GroupProjectListItem = SerializedGroupProject & {
  teamCount: number;
  // student annotations
  myTeamId: string | null;
  myTeamName: string | null;
  hasPreferences: boolean;
};

/** Another project's rubric, offered as a starting point in the rubric editor. */
export type RubricSource = {
  _id: string;
  title: string;
  module: number | null;
  rubric: RubricItem[];
};

// One student row on the teacher assignment board.
export type BoardStudent = {
  _id: string;
  name: string;
  avatarUrl?: string;
  teamId: string | null;
  preferences: SerializedPreference | null;
};

export type TeamFeedbackEntry = {
  category: string;
  /** null for the score-less "overall" comment entry */
  score: number | null;
  comment: string;
  evaluatorName: string;
};

/**
 * One piece of feedback as the team it was written about sees it.
 *
 * Two things are deliberately missing. There is no score: an individual mark
 * invites a hunt for who gave it, which is the same problem as a name, so
 * students get their own grade instead (`myGrade`) and only once the teachers
 * release it. And classmates are never named — every student evaluator arrives
 * as `student`, with no name attached anywhere in the payload. Teachers and
 * judges are named, as the people who came to judge.
 */
export type StudentFeedbackEntry = {
  /** The TeamEvaluation id — what a team points at when publishing a quote. */
  _id: string;
  category: string;
  comment: string;
  evaluatorKind: "teacher" | "judge" | "student";
  /** Set for teachers and judges; always null for students. */
  evaluatorName: string | null;
};

/**
 * Why the feedback is or is not showing, so the student can be told what is
 * left rather than shown an empty panel. Feedback is the reward for handing
 * in: it opens once you have done everything that is open to you.
 */
export type FeedbackUnlock = {
  unlocked: boolean;
  /** Other teams still to score. Zero when team evaluation is not open. */
  teamsToScore: number;
  /** True when peer evaluation is open, you are on a team, and you have not submitted. */
  peerEvalPending: boolean;
};

export type GroupProjectDetails = {
  project: SerializedGroupProject;
  teams: SerializedTeam[];
  // student-only fields
  myTeamId: string | null;
  myPreferences: SerializedPreference | null;
  myPeerEvaluations: PeerEvaluationEntry[];
  myTeamEvaluations: Record<string, TeamEvaluationEntry[]>; // keyed by teamId, own submissions
  myTeamFeedback: StudentFeedbackEntry[]; // comments my team received, once unlocked
  myFeedbackUnlock: FeedbackUnlock;
  /**
   * My own grade — released by the teachers, and only when they have confirmed
   * my peer-evaluation figures. Null until both are true.
   */
  myGrade: StudentGrade | null;
  /** Ids of the comments my team publishes on its showcase page. */
  myShowcaseQuotes: string[];
  // teacher-only fields
  students: BoardStudent[] | null;
  teamEvalSummaries: Record<string, TeamEvalSummary> | null; // keyed by teamId
  /**
   * True once any team evaluation exists for the project: the rubric editor
   * then allows wording changes only, because stored scores point at the
   * rubric keys. Always false for students, who never see the editor.
   */
  rubricLocked: boolean;
};

export type PeerEvaluationEntry = {
  target: string;
  contributionScore: number;
  contributionComment: string;
  teambuildingScore: number;
  teambuildingComment: string;
};

export type TeamEvaluationEntry = {
  category: string;
  /** null for the score-less "overall" comment entry */
  score: number | null;
  comment: string;
};

export type TeamEvalSummary = Record<string, { avg: number; count: number }>;

// Teacher reports
export type PeerEvalReceived = {
  evaluatorName: string;
  contributionScore: number;
  contributionComment: string;
  teambuildingScore: number;
  teambuildingComment: string;
  /** True when the student wrote this about themselves. */
  isSelf: boolean;
  /**
   * True when this evaluator's scores add up to more than zero on an axis —
   * only possible for evaluations stored before the balance rule existed, and
   * shown so a teacher can tell which advice predates it.
   */
  evaluatorUnbalanced: boolean;
};

/**
 * What a teacher made of the peer evaluation for one student: the average the
 * team gave, accepted or replaced. Still on the −2..+2 scale, because it is
 * still not a grade — it is what the teacher carries into the grade.
 */
export type PeerEvalResult = {
  contribution: number;
  teambuilding: number;
  note: string;
  confirmedByName: string;
  /** ISO date string. */
  confirmedAt: string;
  /** What the students had said when this was confirmed, and over how many evaluations. */
  basedOnContribution: number | null;
  basedOnTeambuilding: number | null;
  basedOnCount: number | null;
};

export type PeerEvalStudentReport = {
  userId: string;
  name: string;
  teamId: string;
  teamName: string;
  /**
   * Averages over every evaluation the student received, their own included —
   * the team is assessing how the group work went, and the student is part of
   * the group. These numbers are advice for the teacher setting the individual
   * grade, never a grade in themselves, so nothing here needs to be defended
   * against a student rating themselves generously.
   */
  contributionAvg: number | null;
  teambuildingAvg: number | null;
  /** The two axes averaged — the figure the teacher confirms or replaces. */
  combinedAvg: number | null;
  receivedCount: number;
  givenCount: number;
  /** True when this student's own scores broke the balance rule (pre-rule data). */
  givenUnbalanced: boolean;
  received: PeerEvalReceived[];
  result: PeerEvalResult | null;
  /**
   * What the confirmed figures come to for this student, once there is a team
   * grade to apply them to. Shown to the teacher whether or not the grades
   * have been released — this is what pressing the button would publish.
   */
  grade: IndividualGrade | null;
};

/**
 * What a student is told about their own grade: the grade, and what each rubric
 * row came to for them.
 *
 * The team's project grade and the factor applied to it are deliberately NOT
 * here. A group grade is not a student's to see — and since
 * `grade = projectGrade × factor`, sending either one would hand them the other
 * by division. The teacher-side `IndividualGrade` carries the full arithmetic.
 */
export type StudentGrade = {
  grade: number;
  /** Per rubric row: what that row comes to for this student. Uncapped. */
  categories: Record<string, number>;
};

/**
 * One student's grade as a teacher sees it, with the arithmetic that produced
 * it so nobody has to take it on faith: the team's project grade, the factor
 * the confirmed peer figures apply to it, and the result.
 */
export type IndividualGrade = {
  /** Mean of the team's rubric rows, each blended 80/20 panel/audience. */
  projectGrade: number;
  /** The multiplier from the confirmed contribution and teamwork figures. */
  factor: number;
  /** projectGrade × factor, held to the top of the scale. */
  grade: number;
  /** Per rubric row: what that row comes to for this student. Uncapped. */
  categories: Record<string, number>;
};

export type TeamEvalReport = {
  teamId: string;
  teamName: string;
  categories: TeamEvalSummary;
  entries: (TeamFeedbackEntry & {
    evaluatorIsTeacher: boolean;
    evaluatorIsJudge: boolean;
  })[];
};

export type EvaluationReports = {
  peerEvals: PeerEvalStudentReport[];
  teamEvals: TeamEvalReport[];
};

// External judges
export type SerializedJudgeInvitation = {
  _id: string;
  name: string;
  focus: JudgeFocus;
  token: string;
  hasSubmitted: boolean;
  /** The judge agreed to be named when a team publishes one of their comments. */
  showcaseNameConsent: boolean;
};

export type JudgeView = {
  project: SerializedGroupProject;
  teams: SerializedTeam[];
  judge: { name: string; focus: JudgeFocus; showcaseNameConsent: boolean };
  // own submissions keyed by teamId
  myEvaluations: Record<string, TeamEvaluationEntry[]>;
};
