// Semester display configuration for the calendar.
//
// Events themselves live in the database (CalendarEvent model) and are managed
// through the calendar UI; the original static semester plan was imported via
// scripts/seed-calendar-events.mjs. Category metadata lives in
// app/utils/calendarUtils.ts so the server actions and UI share one source.

/** Months exposed to students/teachers for the active semester (0-indexed). */
export const SEMESTER = {
  year: 2026,
  label: "Autumn Semester 2026",
  /** Inclusive range of months shown, August (7) – December (11). */
  months: [7, 8, 9, 10, 11] as const,
};
