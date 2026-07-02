import {
  GroupProjectStatus,
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
  projectDescription: string;
  links: TeamLinks;
  images: string[];
};

export type SerializedPreference = {
  user: string;
  ambition: string;
  focus: string[];
  techStack: string[];
  about: string;
};

export type SerializedGroupProject = {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: GroupProjectStatus;
  peerEvalOpen: boolean;
  teamEvalOpen: boolean;
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
  score: number;
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
  score: number;
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
  entries: (TeamFeedbackEntry & { evaluatorIsTeacher: boolean })[];
};

export type EvaluationReports = {
  peerEvals: PeerEvalStudentReport[];
  teamEvals: TeamEvalReport[];
};
