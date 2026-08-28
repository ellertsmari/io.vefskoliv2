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

export type GroupProjectDetails = {
  project: SerializedGroupProject;
  teams: SerializedTeam[];
  // student-only fields
  myTeamId: string | null;
  myPreferences: SerializedPreference | null;
  myPeerEvaluations: PeerEvaluationEntry[];
  myTeamEvaluations: Record<string, TeamEvaluationEntry[]>; // keyed by teamId, own submissions
  myTeamFeedback: TeamFeedbackEntry[]; // evaluations received by my team (archived projects)
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
  receivedCount: number;
  givenCount: number;
  received: PeerEvalReceived[];
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
};

export type JudgeView = {
  project: SerializedGroupProject;
  teams: SerializedTeam[];
  judge: { name: string; focus: JudgeFocus };
  // own submissions keyed by teamId
  myEvaluations: Record<string, TeamEvaluationEntry[]>;
};
