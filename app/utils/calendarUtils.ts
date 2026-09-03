import { z } from "zod";
import type {
  EventCategory,
  EventVisibility,
  SemesterInfo,
} from "types/calendarTypes";

/**
 * Calendar domain logic shared by the server actions, the UI and the tests.
 * No "use client"/"use server" directive, so both sides can import it.
 */

export const EVENT_CATEGORIES = [
  "milestone",
  "lecture",
  "groupwork",
  "deadline",
  "holiday",
] as const satisfies readonly EventCategory[];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A repeating event may run for at most this long. */
export const MAX_REPEAT_WEEKS = 26;

/** Forms send "" for an untouched optional field; treat that as absent. */
const optionalString = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional()
  );

export const CalendarEventInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Please add a title")
      .max(120, "Keep the title under 120 characters"),
    description: optionalString(
      z.string().trim().max(2000, "Keep the description under 2000 characters")
    ),
    category: z.enum(EVENT_CATEGORIES),
    startDate: z.string().regex(DATE_RE, "Please pick a date"),
    endDate: optionalString(z.string().regex(DATE_RE, "Please pick a last day")),
    startTime: optionalString(z.string().regex(TIME_RE, "Please pick a time")),
    endTime: optionalString(z.string().regex(TIME_RE, "Please pick a time")),
    link: optionalString(
      z
        .string()
        .trim()
        .max(2000, "Keep the link under 2000 characters")
        .url("Please enter a full link, including https://")
    ),
    visibility: z.enum(["everyone", "team", "private"]).optional(),
    /** Create one copy per week from the start date up to and including this day. */
    repeatWeeklyUntil: optionalString(
      z.string().regex(DATE_RE, "Please pick a last date")
    ),
  })
  .superRefine((input, ctx) => {
    if (input.endDate && input.endDate < input.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "The last day can't be before the first day",
      });
    }
    if (input.endTime && !input.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Add a start time as well",
      });
    }
    if (input.startTime && input.endTime && input.endTime <= input.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "The end time must be after the start time",
      });
    }
    if (input.repeatWeeklyUntil) {
      if (input.repeatWeeklyUntil <= input.startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeatWeeklyUntil"],
          message: "Repeat until a later date than the first one",
        });
      } else if (
        input.repeatWeeklyUntil > addDays(input.startDate, MAX_REPEAT_WEEKS * 7)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["repeatWeeklyUntil"],
          message: `An event can repeat for at most ${MAX_REPEAT_WEEKS} weeks`,
        });
      }
    }
  });

export type CalendarEventInput = z.input<typeof CalendarEventInputSchema>;
export type ParsedCalendarEventInput = z.output<typeof CalendarEventInputSchema>;

/** The stored shape of one occurrence, before ownership is decided. */
export const normalizeEventInput = (input: ParsedCalendarEventInput) => ({
  title: input.title,
  description: input.description,
  category: input.category,
  startDate: input.startDate,
  endDate: input.endDate ?? input.startDate,
  startTime: input.startTime,
  endTime: input.endTime,
  link: input.link,
});

// ── Dates ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayKey = (): string => toDateKey(new Date());

export const addDays = (key: string, days: number): string => {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

/**
 * The dates of a weekly repeating event: the original span, then the same
 * span a week later, and so on while the start is on or before `until`.
 */
export const expandWeekly = (
  startDate: string,
  endDate: string,
  until: string
): Array<{ startDate: string; endDate: string }> => {
  const occurrences: Array<{ startDate: string; endDate: string }> = [];
  for (let week = 0; week <= MAX_REPEAT_WEEKS; week++) {
    const start = addDays(startDate, week * 7);
    if (start > until) break;
    occurrences.push({ startDate: start, endDate: addDays(endDate, week * 7) });
  }
  return occurrences;
};

// ── Semester ──────────────────────────────────────────────────────────────

export type YearMonth = { year: number; month: number };

/** Every calendar month from the first day of term to the last, inclusive. */
export const semesterMonths = (
  startDate: string,
  endDate: string
): YearMonth[] => {
  const [sy, sm] = startDate.split("-").map(Number);
  const [ey, em] = endDate.split("-").map(Number);
  const months: YearMonth[] = [];
  let year = sy;
  let month = sm - 1;
  for (let i = 0; i < 12; i++) {
    months.push({ year, month });
    if (year === ey && month === em - 1) break;
    if (year > ey || (year === ey && month >= em - 1)) break;
    month++;
    if (month === 12) {
      month = 0;
      year++;
    }
  }
  return months;
};

/**
 * Which month to open on: this month when the term is running, the first
 * month before term starts, the last after it ends.
 */
export const initialMonthIndex = (months: YearMonth[], today: string): number => {
  const [y, m] = today.split("-").map(Number);
  const index = months.findIndex((ym) => ym.year === y && ym.month === m - 1);
  if (index >= 0) return index;
  const first = months[0];
  const beforeTerm = y < first.year || (y === first.year && m - 1 < first.month);
  return beforeTerm ? 0 : Math.max(0, months.length - 1);
};

export const SemesterInputSchema = z
  .object({
    label: z.string().trim().min(1, "Please name the semester").max(80),
    startDate: z.string().regex(DATE_RE, "Please pick the first day"),
    endDate: z.string().regex(DATE_RE, "Please pick the last day"),
    spann2Start: optionalString(z.string().regex(DATE_RE, "Please pick a date")),
  })
  .superRefine((input, ctx) => {
    if (input.endDate < input.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "The last day can't be before the first day",
      });
    }
    if (semesterMonths(input.startDate, input.endDate).length > 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "A semester spans at most eight months",
      });
    }
    if (
      input.spann2Start &&
      (input.spann2Start < input.startDate || input.spann2Start > input.endDate)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["spann2Start"],
        message: "Spönn 2 has to start inside the semester",
      });
    }
  });

export type SemesterInput = z.input<typeof SemesterInputSchema>;

export const CopyEventsInputSchema = z
  .object({
    fromDate: z.string().regex(DATE_RE, "Please pick the first day to copy"),
    toDate: z.string().regex(DATE_RE, "Please pick the last day to copy"),
    /** How far forward to move the copies. 52 weeks keeps the weekday. */
    weeks: z.coerce.number().int().min(1).max(104),
  })
  .refine((input) => input.toDate >= input.fromDate, {
    path: ["toDate"],
    message: "The last day can't be before the first day",
  });

export type CopyEventsInput = z.input<typeof CopyEventsInputSchema>;

// ── Permissions ───────────────────────────────────────────────────────────

/** Teachers may edit anything; students only events they own. */
export const canEditEvent = (
  isTeacher: boolean,
  userId: string,
  event: { owner?: unknown }
): boolean => {
  if (isTeacher) return true;
  return event.owner != null && String(event.owner) === userId;
};

/** What a viewer may pick for an event they create. */
export const allowedVisibilities = (isTeacher: boolean): EventVisibility[] =>
  isTeacher ? ["everyone"] : ["private", "team"];

export const defaultVisibility = (isTeacher: boolean): EventVisibility =>
  isTeacher ? "everyone" : "private";

export const describeSemester = (semester: SemesterInfo): string =>
  semester.spann2Start
    ? `${semester.label} · Spönn 2 from ${semester.spann2Start.slice(8)}.${semester.spann2Start.slice(5, 7)}.`
    : semester.label;
