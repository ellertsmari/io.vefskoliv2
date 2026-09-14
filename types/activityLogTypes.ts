export type ActivityStatus = "draft" | "pending" | "approved" | "changesRequested";
export type ActivityPeriod = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  targetMinutes: number;
};
export type ActivityCycle = {
  id: string;
  guideId: string;
  label: string;
  periods: ActivityPeriod[];
  activityCapMinutes: number;
  locked?: boolean;
};
export type ActivitySession = { date: string; minutes: number };
export type ActivityEntry = {
  id: string;
  ownerId: string;
  name: string;
  location: string;
  description: string;
  sessions: ActivitySession[];
  links: string[];
  imageIds: string[];
  status: ActivityStatus;
  revision: number;
  teacherComment: string;
  updatedAt: string;
};
export type ActivityPeriodProgress = ActivityPeriod & {
  recordedMinutes: number;
  eligibleMinutes: number;
  carriedInMinutes: number;
  creditedMinutes: number;
  remainingMinutes: number;
};
export type ActivityProgress = {
  periods: ActivityPeriodProgress[];
  recordedMinutes: number;
  pendingMinutes: number;
  eligibleMinutes: number;
  creditedMinutes: number;
  targetMinutes: number;
  complete: boolean;
  entryCredits: Record<string, number>;
};
export type ActivityStudent = {
  id: string;
  name: string;
  entries: ActivityEntry[];
  progress: ActivityProgress;
};
export type ActivityLogData = {
  cycles: ActivityCycle[];
  cycle: ActivityCycle | null;
  students: ActivityStudent[];
  viewerId: string;
  teacher: boolean;
};
export type ActivityEntryInput = {
  id?: string;
  revision?: number;
  guideId: string;
  cycleId: string;
  name: string;
  location: string;
  description: string;
  sessions: ActivitySession[];
  links: string[];
  images: { id?: string; data?: string }[];
  status: "draft" | "pending";
};
