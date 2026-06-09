import { z } from "zod";

/**
 * Calendar domain logic shared by the server actions, the UI, and tests.
 * No "use client"/"use server" directive — importable from both sides.
 */

export type EventCategory =
  | "guide"
  | "lecture"
  | "groupwork"
  | "module2"
  | "holiday";

/** Categories scheduled as a single day with start/end TIMES. */
export const TIMED_CATEGORIES: readonly EventCategory[] = [
  "lecture",
  "module2",
];

/** Categories scheduled as a RANGE of whole days, no times. */
export const RANGED_CATEGORIES: readonly EventCategory[] = [
  "guide",
  "groupwork",
  "holiday",
];

export const isTimedCategory = (category: EventCategory): boolean =>
  TIMED_CATEGORIES.includes(category);

export interface CategoryMeta {
  label: string;
  /** CSS custom property used for the accent colour. */
  color: string;
}

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  guide: { label: "Guide", color: "var(--theme-module3-100)" },
  lecture: { label: "Lecture", color: "var(--error-success-100)" },
  groupwork: { label: "Group work", color: "var(--error-warning-100)" },
  module2: { label: "Module 2 event", color: "var(--error-failure-100)" },
  holiday: { label: "Holiday", color: "var(--primary-black-30)" },
};

/** Students default to logging community events; teachers to scheduling lectures. */
export const defaultCategoryForRole = (
  role: string | undefined
): EventCategory => (role === "teacher" ? "lecture" : "module2");

/** A calendar event as sent to the client. */
export type ClientCalendarEvent = {
  id: string;
  title: string;
  description?: string;
  category: EventCategory;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD, === startDate for timed categories
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  /** null = school event (seeded semester plan) */
  ownerId: string | null;
  ownerName: string;
  visibility: "everyone" | "restricted";
  sharedWith: string[];
  /** computed server-side for the CURRENT viewer */
  canEdit: boolean;
};

type EventLike = {
  owner?: unknown;
  visibility?: string;
  sharedWith?: unknown[];
};

/** Teachers can edit anything; students only events they own. School events (owner null) are teacher-only. */
export const canEditEvent = (
  role: string | undefined,
  userId: string,
  event: EventLike
): boolean => {
  if (role === "teacher") return true;
  return event.owner != null && String(event.owner) === userId;
};

/** Restricted events are visible to the owner, the shared-with list, and teachers. */
export const canViewEvent = (
  role: string | undefined,
  userId: string,
  event: EventLike
): boolean => {
  if (event.visibility !== "restricted") return true;
  if (role === "teacher") return true;
  if (event.owner != null && String(event.owner) === userId) return true;
  return (event.sharedWith ?? []).some((id) => String(id) === userId);
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Input validation for create/update. Timed categories require a start and
 * end time on a single day; ranged categories require an end date on or after
 * the start date and carry no times.
 */
export const CalendarEventInputSchema = z
  .object({
    title: z.string().trim().min(1, "Please add a title").max(120),
    description: z.string().trim().max(2000).optional(),
    category: z.enum(["guide", "lecture", "groupwork", "module2", "holiday"]),
    startDate: z.string().regex(DATE_RE, "Please pick a date"),
    endDate: z.string().regex(DATE_RE).optional(),
    startTime: z.string().regex(TIME_RE, "Please pick a start time").optional(),
    endTime: z.string().regex(TIME_RE, "Please pick an end time").optional(),
    visibility: z.enum(["everyone", "restricted"]).default("everyone"),
    sharedWith: z.array(z.string().trim().min(1)).max(100).default([]),
  })
  .superRefine((input, ctx) => {
    if (isTimedCategory(input.category)) {
      if (!input.startTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["startTime"],
          message: "This event type needs a start time",
        });
      if (!input.endTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "This event type needs an end time",
        });
      if (input.startTime && input.endTime && input.endTime <= input.startTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endTime"],
          message: "The end time must be after the start time",
        });
    } else {
      if (!input.endDate)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "This event type needs an end date",
        });
      if (input.endDate && input.endDate < input.startDate)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["endDate"],
          message: "The end date can't be before the start date",
        });
    }
  });

export type CalendarEventInput = z.infer<typeof CalendarEventInputSchema>;

/**
 * Normalize validated input into the stored shape: timed events collapse to a
 * single day and ranged events drop any stray times; an empty shared list on
 * "everyone" stays empty.
 */
export const normalizeEventInput = (input: CalendarEventInput) => {
  const timed = isTimedCategory(input.category);
  return {
    title: input.title,
    description: input.description || undefined,
    category: input.category,
    startDate: input.startDate,
    endDate: timed ? input.startDate : input.endDate!,
    startTime: timed ? input.startTime : undefined,
    endTime: timed ? input.endTime : undefined,
    visibility: input.visibility,
    sharedWith: input.visibility === "restricted" ? input.sharedWith : [],
  };
};

/** Safety cap so a typo'd year can't expand into thousands of day cells. */
const MAX_RANGE_DAYS = 180;

/** Every "YYYY-MM-DD" key from start to end inclusive (capped). */
export const eachDateInRange = (start: string, end: string): string[] => {
  const dates: string[] = [];
  const [y, m, d] = start.split("-").map(Number);
  const cursor = new Date(y, m - 1, d);
  const pad = (n: number) => String(n).padStart(2, "0");
  for (let i = 0; i < MAX_RANGE_DAYS; i++) {
    const key = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(
      cursor.getDate()
    )}`;
    dates.push(key);
    if (key >= end) break;
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};
