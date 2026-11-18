import { z } from "zod";
import type {
  CalendarEvent,
  MeetingPollInfo,
  PollOption,
  SignupSheetInfo,
} from "types/calendarTypes";

/**
 * Meeting logic shared by the server actions, the UI and the tests: slot
 * arithmetic, what counts as "already taken" on someone's calendar, and the
 * input schemas. No "use client"/"use server" directive, so both sides can
 * import it.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** How long a meeting or a sign-up slot may be, in minutes. */
export const MEETING_LENGTHS = [10, 15, 20, 30, 45, 60, 90, 120] as const;
export type MeetingLength = (typeof MEETING_LENGTHS)[number];

export const isMeetingLength = (value: number): value is MeetingLength =>
  (MEETING_LENGTHS as readonly number[]).includes(value);

/** "20 min", "1 hour", "1½ hours", "2 hours". */
export const lengthLabel = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 hour";
  const hours = minutes / 60;
  return Number.isInteger(hours)
    ? `${hours} hours`
    : `${Math.floor(hours)}½ hours`;
};

// ── Minutes ───────────────────────────────────────────────────────────────

/** "HH:MM" as minutes after midnight. */
export const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Minutes after midnight as "HH:MM"; the end of the day is "23:59". */
export const fromMinutes = (total: number): string => {
  const capped = Math.min(Math.max(total, 0), 24 * 60 - 1);
  return `${String(Math.floor(capped / 60)).padStart(2, "0")}:${String(capped % 60).padStart(2, "0")}`;
};

/** A sheet holds at most this many slots; a full day of 10-minute slots is 84. */
export const MAX_SLOTS = 100;

export type TimeSlot = { startTime: string; endTime: string };

/**
 * Back-to-back slots of one length filling a time range, e.g. 13:00–14:00 in
 * 20-minute slots is 13:00, 13:20 and 13:40. A slot that would run past the
 * end of the range is left out.
 */
export const buildSlots = (
  startTime: string,
  endTime: string,
  minutes: number
): TimeSlot[] => {
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || minutes <= 0) return [];
  const end = toMinutes(endTime);
  const slots: TimeSlot[] = [];
  for (
    let start = toMinutes(startTime);
    start + minutes <= end && slots.length < MAX_SLOTS;
    start += minutes
  ) {
    slots.push({ startTime: fromMinutes(start), endTime: fromMinutes(start + minutes) });
  }
  return slots;
};

// ── Already taken ─────────────────────────────────────────────────────────

/** How long an event with a start time but no end is taken to last. */
const ASSUMED_EVENT_MINUTES = 60;

type BusyEvent = Pick<
  CalendarEvent,
  | "id"
  | "date"
  | "endDate"
  | "time"
  | "endTime"
  | "category"
  | "title"
  | "mine"
  | "tentative"
>;

/**
 * The first event on the viewer's calendar that clashes with a time, or null
 * when the time is free.
 *
 * What counts as taken: anything with a time on it that the viewer attends
 * (lectures, meetings, group work, key dates), a holiday, and the viewer's
 * own "not available". What does not: deadlines (a due date is not a place
 * to be), another teacher's "not available", and day-long events without a
 * time such as a group project's kickoff-to-hand-in bar.
 */
export const clashOf = (
  events: BusyEvent[],
  date: string,
  startTime: string,
  endTime: string
): BusyEvent | null => {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);
  for (const event of events) {
    if (date < event.date || date > (event.endDate ?? event.date)) continue;
    if (event.tentative || event.category === "deadline") continue;
    if (event.category === "unavailable" && !event.mine) continue;
    if (!event.time) {
      if (event.category === "holiday" || event.category === "unavailable") return event;
      continue;
    }
    const eventStart = toMinutes(event.time);
    const eventEnd = event.endTime
      ? toMinutes(event.endTime)
      : eventStart + ASSUMED_EVENT_MINUTES;
    if (start < eventEnd && eventStart < end) return event;
  }
  return null;
};

// ── Sign-up sheets ────────────────────────────────────────────────────────

const optionalText = (max: number, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max, message).optional()
  );

/** Why a list of slot starts cannot be used, or null when it can. */
export const slotsProblem = (starts: string[], minutes: number): string | null => {
  if (starts.length === 0) return "Add at least one time slot";
  if (starts.length > MAX_SLOTS) return `A sheet holds at most ${MAX_SLOTS} slots`;
  const sorted = [...starts].sort();
  for (let i = 0; i < sorted.length; i++) {
    if (!TIME_RE.test(sorted[i])) return "Times look like 13:00";
    if (toMinutes(sorted[i]) + minutes > 24 * 60 - 1) {
      return "A slot can't run past midnight";
    }
    if (i > 0 && toMinutes(sorted[i - 1]) + minutes > toMinutes(sorted[i])) {
      return `${sorted[i - 1]} and ${sorted[i]} overlap`;
    }
  }
  return null;
};

export const SignupSheetInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Please add a title")
      .max(120, "Keep the title under 120 characters"),
    description: optionalText(1000, "Keep the description under 1000 characters"),
    date: z.string().regex(DATE_RE, "Please pick a day"),
    slotMinutes: z.coerce
      .number()
      .refine(isMeetingLength, "Pick one of the listed lengths"),
    /** Places on each slot. */
    capacity: z.coerce.number().int().min(1).max(200).default(1),
    /** The start time of every slot, "HH:MM". */
    slots: z.array(z.string()).max(MAX_SLOTS),
    audience: z.enum(["project", "everyone", "team", "shared"]),
    /** audience "project": the group project. */
    projectId: z.string().trim().optional(),
    /** audience "shared": user ids. */
    sharedWith: z.array(z.string().trim().min(1)).max(200).default([]),
  })
  .superRefine((input, ctx) => {
    const problem = slotsProblem(input.slots, input.slotMinutes);
    if (problem) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["slots"], message: problem });
    }
    if (input.audience === "project" && !input.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectId"],
        message: "Pick the group project",
      });
    }
    if (input.audience === "shared" && input.sharedWith.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sharedWith"],
        message: "Pick at least one person",
      });
    }
  });

export type SignupSheetInput = z.input<typeof SignupSheetInputSchema>;

/** Slots the viewer could still take: not started and not full. */
export const openSlots = (sheet: SignupSheetInfo) =>
  sheet.slots.filter((slot) => !slot.past && !slot.full);

/**
 * The viewer is expected to pick a slot and has not. Whoever runs a sheet is
 * never nagged about it, even where they could take a slot themselves.
 */
export const needsSignUp = (sheet: SignupSheetInfo): boolean =>
  sheet.canSignUp &&
  !sheet.canManage &&
  !sheet.mySlot &&
  openSlots(sheet).length > 0;

/**
 * Sign-up sheets as calendar events, for the viewer:
 * - the slot they (or their team) hold, at its own time;
 * - for whoever runs the sheet, the whole session with its running order;
 * - for someone who still has to pick, the session as a reminder.
 */
export const sheetCalendarEvents = (sheets: SignupSheetInfo[]): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  for (const sheet of sheets) {
    if (sheet.slots.length === 0) continue;
    const first = sheet.slots[0];
    const last = sheet.slots[sheet.slots.length - 1];
    const base = {
      date: sheet.date,
      category: "meeting" as const,
      source: "generated" as const,
      canEdit: false,
      meetingRef: { kind: "sheet" as const, id: sheet.id },
    };
    const mine = sheet.slots.find((slot) => slot.startTime === sheet.mySlot);
    if (mine) {
      events.push({
        ...base,
        id: `sheet-${sheet.id}-mine`,
        title: sheet.title,
        time: mine.startTime,
        endTime: mine.endTime,
        description: sheet.signUpAs
          ? `${sheet.signUpAs}'s slot.`
          : "Your slot.",
        mine: true,
      });
    }
    if (sheet.canManage) {
      const order = sheet.slots
        .filter((slot) => slot.claims.length > 0)
        .map(
          (slot) =>
            `${slot.startTime} ${slot.claims.map((claim) => claim.label).join(", ")}`
        );
      events.push({
        ...base,
        id: `sheet-${sheet.id}`,
        title: sheet.title,
        time: first.startTime,
        endTime: last.endTime,
        description:
          order.length > 0 ? order.join(" · ") : "Nobody has signed up yet.",
        mine: sheet.isOwner,
      });
    } else if (!mine && needsSignUp(sheet)) {
      events.push({
        ...base,
        id: `sheet-${sheet.id}-open`,
        title: `Sign up: ${sheet.title}`,
        time: first.startTime,
        endTime: last.endTime,
        description: "Pick a time.",
        tentative: true,
      });
    }
  }
  return events;
};

// ── Find a time ───────────────────────────────────────────────────────────

/** A poll asks about at most this many days. */
export const MAX_POLL_DAYS = 14;

/**
 * The size of one cell in a poll's grid: half an hour, or a quarter for
 * meetings shorter than that, so a 20-minute meeting is not asked about in
 * half-hour blocks.
 */
export const pollCellMinutes = (lengthMinutes: number): number =>
  lengthMinutes >= 30 ? 30 : 15;

/** The start of every cell in one day of a poll's grid. */
export const pollTimes = (
  dayStart: string,
  dayEnd: string,
  lengthMinutes: number
): string[] =>
  buildSlots(dayStart, dayEnd, pollCellMinutes(lengthMinutes)).map(
    (slot) => slot.startTime
  );

export const cellKey = (date: string, time: string) => `${date} ${time}`;

type PollShape = Pick<
  MeetingPollInfo,
  "days" | "dayStart" | "dayEnd" | "lengthMinutes" | "responses"
>;

/** Every cell a poll asks about, for checking an answer against. */
export const pollCells = (poll: Omit<PollShape, "responses">): Set<string> => {
  const times = pollTimes(poll.dayStart, poll.dayEnd, poll.lengthMinutes);
  return new Set(poll.days.flatMap((day) => times.map((time) => cellKey(day, time))));
};

/**
 * Every time the meeting could start, best first: most people free, then
 * earliest. A person is free for a time when they marked every cell it
 * covers. Times nobody can make are left out.
 */
export const pollOptions = (poll: PollShape): PollOption[] => {
  const cell = pollCellMinutes(poll.lengthMinutes);
  const times = pollTimes(poll.dayStart, poll.dayEnd, poll.lengthMinutes);
  const end = toMinutes(poll.dayEnd);
  const answers = poll.responses.map((response) => ({
    name: response.name,
    cells: new Set(response.cells),
  }));
  const options: PollOption[] = [];
  for (const date of poll.days) {
    for (const startTime of times) {
      const start = toMinutes(startTime);
      if (start + poll.lengthMinutes > end) continue;
      const covered: string[] = [];
      for (let t = start; t < start + poll.lengthMinutes; t += cell) {
        covered.push(cellKey(date, fromMinutes(t)));
      }
      const free: string[] = [];
      const busy: string[] = [];
      for (const answer of answers) {
        (covered.every((key) => answer.cells.has(key)) ? free : busy).push(answer.name);
      }
      if (free.length === 0) continue;
      options.push({
        date,
        startTime,
        endTime: fromMinutes(start + poll.lengthMinutes),
        free,
        busy,
      });
    }
  }
  return options.sort(
    (a, b) =>
      b.free.length - a.free.length ||
      a.date.localeCompare(b.date) ||
      a.startTime.localeCompare(b.startTime)
  );
};

export const MeetingPollInputSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Please add a title")
      .max(120, "Keep the title under 120 characters"),
    description: optionalText(1000, "Keep the description under 1000 characters"),
    days: z
      .array(z.string().regex(DATE_RE, "Please pick a day"))
      .min(1, "Pick at least one day")
      .max(MAX_POLL_DAYS, `Pick at most ${MAX_POLL_DAYS} days`),
    dayStart: z.string().regex(TIME_RE, "Times look like 09:00"),
    dayEnd: z.string().regex(TIME_RE, "Times look like 16:00"),
    lengthMinutes: z.coerce
      .number()
      .refine(isMeetingLength, "Pick one of the listed lengths"),
    audience: z.enum(["everyone", "team", "shared"]),
    /** audience "shared": user ids. */
    sharedWith: z.array(z.string().trim().min(1)).max(200).default([]),
  })
  .superRefine((input, ctx) => {
    if (
      TIME_RE.test(input.dayStart) &&
      TIME_RE.test(input.dayEnd) &&
      toMinutes(input.dayStart) + input.lengthMinutes > toMinutes(input.dayEnd)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dayEnd"],
        message: "The hours need room for at least one meeting",
      });
    }
    if (input.audience === "shared" && input.sharedWith.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sharedWith"],
        message: "Pick at least one person",
      });
    }
  });

export type MeetingPollInput = z.input<typeof MeetingPollInputSchema>;
