// The calendar's shared contract.
//
// These types live here rather than beside the calendar data because group work
// also produces calendar events (serverActions/groups/getGroupCalendarEvents),
// and a server action must not have to reach up into a route folder to describe
// what it returns.

export type EventCategory =
  | "milestone"
  | "lecture"
  | "groupwork"
  | "deadline"
  | "holiday";

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
  /** Optional longer description shown in the day detail panel. */
  description?: string;
}

export interface CategoryMeta {
  label: string;
  /** CSS custom property used for the accent colour. */
  color: string;
}
