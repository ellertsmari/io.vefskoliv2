// The calendar's shared contract.
//
// These types live here rather than beside the calendar UI because group work
// also produces calendar events (serverActions/groups/getGroupCalendarEvents),
// and a server action must not have to reach up into a route folder to describe
// what it returns.

export type EventCategory =
  | "milestone"
  | "lecture"
  | "groupwork"
  | "deadline"
  | "holiday"
  /** A teacher is busy (teaching another group); blocks meeting slots. */
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
  studentName: string;
  studentAvatarUrl?: string;
  /** The other teachers attending, by name. */
  withTeachers: string[];
  /** Set when the student put it on their team's calendar too. */
  teamName?: string;
}
