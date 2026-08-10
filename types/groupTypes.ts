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
};

// Public showcase (no auth — students link these pages from portfolios/CVs)
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
  teams: ShowcaseTeam[];
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
};

export type PeerEvalStudentReport = {
  userId: string;
  name: string;
  teamId: string;
  teamName: string;
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
