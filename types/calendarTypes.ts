// The calendar's shared contract.
//
// These types live here rather than beside the calendar UI because group work
// also produces calendar events (serverActions/groups/getGroupCalendarEvents),
// and a server action must not have to reach up into a route folder to describe
// what it returns.

export type EventCategory =
  | "milestone"
  /** Teachers only. A timed lecture blocks meeting slots for every teacher. */
  | "lecture"
  | "groupwork"
  | "deadline"
  /** Teachers only. Blocks meeting slots for the whole day. */
  | "holiday"
  /** A teacher is busy (teaching another group); blocks their own slots. */
  | "unavailable"
  /** A student's booked meeting with the teachers. Made by booking only. */
  | "meeting";

/**
 * Who may see an event.
 * - everyone: every signed-in user (school and teacher events)
 * - team: the owner and the members of the owner's team
 * - shared: the owner and the people they picked
 * - private: the owner only
 * Teachers see everything regardless.
 */
export type EventVisibility = "everyone" | "team" | "shared" | "private";

/** Where an event came from; decides whether it can be edited in place. */
export type EventSource =
  | "school" // imported semester plan or created by a teacher
  | "user" // created by a student for themselves or their team
  | "generated"; // derived from other data (group projects); edit it there

export interface CalendarEvent {
  id: string;
  /** ISO date, "YYYY-MM-DD", local (no timezone offset). */
  date: string;
  /**
   * Optional inclusive last day ("YYYY-MM-DD") for events spanning several
   * days (e.g. group projects, holidays) — rendered as a continuous bar
   * across the covered days.
   */
  endDate?: string;
  title: string;
  category: EventCategory;
  /** Optional start time, e.g. "10:00". */
  time?: string;
  /** Optional end time, e.g. "12:00". */
  endTime?: string;
  /** Optional longer description shown in the day detail panel. */
  description?: string;
  /** Optional link, e.g. the guide a lecture covers or a recording. */
  link?: string;
  source?: EventSource;
  visibility?: EventVisibility;
  /** Shown in the panel: "Vefskólinn", a teacher's name, or "Anna's team". */
  ownerLabel?: string;
  /** Who created it, for the "added by" line; absent for imported events. */
  ownerName?: string;
  ownerAvatarUrl?: string;
  /** For "shared" events: who it was shared with. */
  sharedWith?: Array<{ id: string; name: string }>;
  /** Computed server-side for the current viewer. */
  canEdit?: boolean;
  /** Set on every occurrence of a repeating event. */
  seriesId?: string;
  /** The viewer created it. Decides whose "not available" counts as busy. */
  mine?: boolean;
  /** A reminder rather than a place to be; never counts as "taken". */
  tentative?: boolean;
  /** Set on events drawn from a sign-up sheet; opens it in Meetings. */
  meetingRef?: { kind: "sheet"; id: string };
}

export interface CategoryMeta {
  label: string;
  /** CSS custom property used for the accent colour. */
  color: string;
}

/** The term the calendar shows; only one is active at a time. */
export interface SemesterInfo {
  label: string;
  /** First and last day of term, "YYYY-MM-DD". */
  startDate: string;
  endDate: string;
  /** First day of Spönn 2, when the term has one. */
  spann2Start?: string;
  /** False until a teacher has saved one; the built-in default is shown. */
  saved: boolean;
}

/** A weekly window in which students may book a meeting with the teachers. */
export interface BookingWindowInfo {
  id: string;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  startTime: string;
  endTime: string;
  /** How long each meeting in the window lasts, in minutes. */
  slotMinutes: number;
  /** Inclusive "YYYY-MM-DD" range the window applies to. */
  validFrom: string;
  validTo: string;
}

/** One bookable meeting time, offered only when enough teachers are free. */
export interface MeetingSlot {
  date: string;
  startTime: string;
  endTime: string;
  /** Names of the teachers who would attend. */
  teachers: string[];
}

/** A booked meeting as the teacher dashboard lists it. */
export interface UpcomingMeeting {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  /** Who the teacher is meeting: a student, a team, or the meeting's title. */
  studentName: string;
  studentAvatarUrl?: string;
  /** The other teachers attending, by name. */
  withTeachers: string[];
  /** Set when the student put it on their team's calendar too. */
  teamName?: string;
}

// ── Sign-up sheets ────────────────────────────────────────────────────────

/**
 * Who a sign-up sheet is for.
 * - project: the teams of one group project; a team takes one slot together
 * - everyone / team / shared: people sign up one by one
 */
export type SignupAudience = "project" | "everyone" | "team" | "shared";

/** One team or person on a slot. */
export interface SignupClaim {
  /** Team id on a team sheet, user id otherwise. */
  id: string;
  /** Team name or the person's name. */
  label: string;
  /** Team members' names, on a team sheet. */
  members?: string[];
  /** The viewer, or the viewer's team. */
  mine: boolean;
}

export interface SignupSlot {
  startTime: string;
  endTime: string;
  claims: SignupClaim[];
  /** No places left. */
  full: boolean;
  /** Already started; nobody can sign up any more. */
  past: boolean;
}

export interface SignupSheetInfo {
  id: string;
  title: string;
  description?: string;
  /** "YYYY-MM-DD". */
  date: string;
  slotMinutes: number;
  /** Places on each slot. */
  capacity: number;
  audience: SignupAudience;
  /** True when a whole team takes a slot. */
  byTeam: boolean;
  /** "Teams of Module 3", "Everyone", "Kaffistofan", "Anna, Björn". */
  audienceLabel: string;
  ownerName: string;
  isOwner: boolean;
  /** The owner and teachers: clear, move and assign slots, delete the sheet. */
  canManage: boolean;
  /** The viewer (or their team) may take a slot. */
  canSignUp: boolean;
  /** Who would be signed up: the viewer's team name on a team sheet. */
  signUpAs?: string;
  /** Start time of the slot the viewer (or their team) holds. */
  mySlot?: string;
  slots: SignupSlot[];
  /** For managers of a team sheet: teams that have not picked a slot yet. */
  waiting?: Array<{ id: string; label: string }>;
}

/** What the "new sign-up sheet" form may offer the viewer. */
export interface SignupTargets {
  /** Teachers only: group projects that have teams. */
  projects: Array<{ id: string; title: string; teams: number }>;
  /** The viewer's current team, if any. */
  teamName: string | null;
}

// ── Find a time ───────────────────────────────────────────────────────────

/** Who a "find a time" poll is for; people answer one by one. */
export type PollAudience = "everyone" | "team" | "shared";

export interface PollResponse {
  /** User id. */
  id: string;
  name: string;
  /** Grid cells the person is free in, each "YYYY-MM-DD HH:MM". */
  cells: string[];
  mine: boolean;
}

export interface MeetingPollInfo {
  id: string;
  title: string;
  description?: string;
  /** Candidate days, "YYYY-MM-DD", in order. */
  days: string[];
  /** The hours asked about on each day, "HH:MM". */
  dayStart: string;
  dayEnd: string;
  /** How long the meeting will be. */
  lengthMinutes: number;
  audience: PollAudience;
  audienceLabel: string;
  ownerName: string;
  isOwner: boolean;
  /** The owner and teachers: pick the time, delete the poll. */
  canManage: boolean;
  responses: PollResponse[];
  /** The viewer has marked their times. */
  answered: boolean;
  /** How many people were asked, when that is a fixed list. */
  invited?: number;
}

/** One possible meeting time on a poll, with who can make it. */
export interface PollOption {
  date: string;
  startTime: string;
  endTime: string;
  /** Names of those who are free for all of it. */
  free: string[];
  /** Names of those who answered but are not. */
  busy: string[];
}
