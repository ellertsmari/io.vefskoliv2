"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { BookingWindow } from "../models/bookingWindow";
import { CalendarEvent } from "../models/calendarEvent";
import { SignupSheet } from "../models/signupSheet";
import { Team } from "../models/team";
import { User } from "../models/user";
import { isActingAsTeacher } from "../utils/userUtils";
import {
  BookMeetingInputSchema,
  BookingWindowInputSchema,
  MEETING_SLOT_MINUTES,
  MIN_TEACHERS_PRESENT,
  SCHOOL_BUSY_CATEGORIES,
  TEACHER_BUSY_CATEGORIES,
  addDays,
  coversSlot,
  timesOverlap,
  todayKey,
  weekdayOf,
  type BookMeetingInput,
  type BookingWindowInput,
  type BusyBlock,
} from "../utils/calendarUtils";
import { buildSlots, fromMinutes, isMeetingLength, toMinutes } from "../utils/meetingUtils";
import type {
  BookingWindowInfo,
  MeetingSlot,
  UpcomingMeeting,
} from "types/calendarTypes";
import {
  failure,
  success,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
  invalidInput,
} from "../utils/errors";

const CALENDAR_PATH = "/LMS/calendar";

/** How far ahead slots are offered; keeps the computation small. */
const MAX_RANGE_DAYS = 200;

// ── Meeting hours (teacher-managed) ───────────────────────────────────────

type WindowRow = {
  _id: ObjectId;
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes?: number;
  validFrom: string;
  validTo: string;
};

const toInfo = (row: WindowRow): BookingWindowInfo => ({
  id: String(row._id),
  weekday: row.weekday,
  startTime: row.startTime,
  endTime: row.endTime,
  slotMinutes: row.slotMinutes ?? MEETING_SLOT_MINUTES,
  validFrom: row.validFrom,
  validTo: row.validTo,
});

export async function getBookingWindows(): Promise<BookingWindowInfo[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  try {
    const rows = await BookingWindow.find()
      .sort({ weekday: 1, startTime: 1 })
      .lean<WindowRow[]>();
    return rows.map(toInfo);
  } catch (error) {
    handleActionError("getBookingWindows", error);
    return [];
  }
}

export async function saveBookingWindow(
  data: BookingWindowInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isActingAsTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = BookingWindowInputSchema.safeParse(data);
  if (!validated.success) {
    return invalidInput(validated.error);
  }
  if (!isMeetingLength(validated.data.slotMinutes)) {
    return failure(ErrorMessages.INVALID_INPUT, {
      slotMinutes: ["Pick one of the listed lengths"],
    });
  }

  try {
    const created = await BookingWindow.create(validated.data);
    revalidatePath(CALENDAR_PATH);
    return success({ id: String(created._id) }, "Meeting hours added");
  } catch (error) {
    return handleActionError("saveBookingWindow", error, "Failed to add meeting hours");
  }
}

export async function deleteBookingWindow(
  windowId: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isActingAsTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);
  if (!ObjectId.isValid(windowId)) return failure(ErrorMessages.NOT_FOUND("Meeting hours"));

  try {
    const result = await BookingWindow.deleteOne({ _id: new ObjectId(windowId) });
    if (result.deletedCount === 0) return failure(ErrorMessages.NOT_FOUND("Meeting hours"));
    revalidatePath(CALENDAR_PATH);
    return successNoData("Meeting hours removed");
  } catch (error) {
    return handleActionError("deleteBookingWindow", error, "Failed to remove meeting hours");
  }
}

// ── Slots ─────────────────────────────────────────────────────────────────

type Teacher = { _id: ObjectId; name: string };

type BusyRow = BusyBlock & { owner: ObjectId | null };

/** A time some teachers are already spoken for: a meeting or a sign-up sheet. */
type Engagement = {
  date: string;
  startTime: string;
  endTime: string;
  teachers: Set<string>;
};

type MeetingEventRow = {
  owner: ObjectId | null;
  sharedWith?: ObjectId[];
  startDate: string;
  startTime?: string;
  endTime?: string;
};

type SheetRow = {
  owner: ObjectId;
  date: string;
  slots: Array<{ startTime: string; endTime: string }>;
};

/** A meeting saved without an end is taken to last this long. */
const ASSUMED_MEETING_MINUTES = 60;

/**
 * Which teachers are free for one slot. A lecture or holiday on the school
 * calendar takes everyone; otherwise a teacher is free unless one of their
 * own "not available" events covers the slot.
 */
const freeTeachers = (
  teachers: Teacher[],
  busy: BusyRow[],
  date: string,
  startTime: string,
  endTime: string
): Teacher[] => {
  const covering = busy.filter((block) => coversSlot(block, date, startTime, endTime));
  if (covering.some((block) => block.category !== "unavailable")) return [];
  return teachers.filter(
    (teacher) =>
      !covering.some(
        (block) => block.owner && String(block.owner) === String(teacher._id)
      )
  );
};

/**
 * Every bookable slot between two dates. A slot is offered when it lies in
 * a meeting-hours window, is in the future, no lecture or holiday is on, and
 * at least MIN_TEACHERS_PRESENT teachers are free: not "not available", not
 * in another meeting, and not running a sign-up sheet at that time.
 */
type ComputedSlot = MeetingSlot & { teacherIds: ObjectId[] };

async function computeSlots(fromDate: string, toDate: string): Promise<ComputedSlot[]> {
  const windows = await BookingWindow.find({
    validFrom: { $lte: toDate },
    validTo: { $gte: fromDate },
  }).lean<WindowRow[]>();
  if (windows.length === 0) return [];

  const teachers = await User.find(
    { role: "teacher", status: { $ne: "pending" } },
    { name: 1 }
  ).lean<Teacher[]>();
  if (teachers.length < MIN_TEACHERS_PRESENT) return [];

  const [busy, meetings, sheets] = await Promise.all([
    // School-wide blocks must be on the school calendar: a student's own
    // event, whatever it is called, keeps nobody out of a meeting.
    CalendarEvent.find(
      {
        startDate: { $lte: toDate },
        endDate: { $gte: fromDate },
        $or: [
          { category: { $in: TEACHER_BUSY_CATEGORIES } },
          { category: { $in: SCHOOL_BUSY_CATEGORIES }, visibility: "everyone" },
        ],
      },
      { owner: 1, category: 1, startDate: 1, endDate: 1, startTime: 1, endTime: 1 }
    ).lean<BusyRow[]>(),
    CalendarEvent.find(
      { category: "meeting", startDate: { $gte: fromDate, $lte: toDate } },
      { owner: 1, sharedWith: 1, startDate: 1, startTime: 1, endTime: 1 }
    ).lean<MeetingEventRow[]>(),
    SignupSheet.find(
      {
        date: { $gte: fromDate, $lte: toDate },
        owner: { $in: teachers.map((teacher) => teacher._id) },
      },
      { owner: 1, date: 1, "slots.startTime": 1, "slots.endTime": 1 }
    ).lean<SheetRow[]>(),
  ]);

  // A meeting takes whoever set it up and whoever it is shared with; a
  // sign-up sheet takes the teacher who runs it, from its first slot to its
  // last. Another teacher sitting in on a sheet marks "not available".
  const engagements: Engagement[] = [];
  for (const meeting of meetings) {
    if (!meeting.startTime) continue;
    engagements.push({
      date: meeting.startDate,
      startTime: meeting.startTime,
      endTime:
        meeting.endTime ??
        fromMinutes(toMinutes(meeting.startTime) + ASSUMED_MEETING_MINUTES),
      teachers: new Set([meeting.owner, ...(meeting.sharedWith ?? [])].map(String)),
    });
  }
  for (const sheet of sheets) {
    if (sheet.slots.length === 0) continue;
    engagements.push({
      date: sheet.date,
      startTime: sheet.slots[0].startTime,
      endTime: sheet.slots[sheet.slots.length - 1].endTime,
      teachers: new Set([String(sheet.owner)]),
    });
  }

  const now = new Date();
  const today = todayKey();
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const slots: ComputedSlot[] = [];
  // Two windows can overlap; a time is offered once.
  const offered = new Set<string>();
  for (let date = fromDate, i = 0; date <= toDate && i < MAX_RANGE_DAYS; date = addDays(date, 1), i++) {
    if (date < today) continue;
    const weekday = weekdayOf(date);
    for (const window of windows) {
      if (window.weekday !== weekday) continue;
      if (date < window.validFrom || date > window.validTo) continue;
      const minutes = window.slotMinutes ?? MEETING_SLOT_MINUTES;
      for (const { startTime, endTime } of buildSlots(
        window.startTime,
        window.endTime,
        minutes
      )) {
        if (date === today && startTime <= nowTime) continue;
        if (offered.has(`${date} ${startTime}`)) continue;
        const engaged = engagements.filter(
          (engagement) =>
            engagement.date === date &&
            timesOverlap(startTime, endTime, engagement.startTime, engagement.endTime)
        );
        const free = freeTeachers(teachers, busy, date, startTime, endTime).filter(
          (teacher) =>
            !engaged.some((engagement) => engagement.teachers.has(String(teacher._id)))
        );
        if (free.length < MIN_TEACHERS_PRESENT) continue;
        offered.add(`${date} ${startTime}`);
        slots.push({
          date,
          startTime,
          endTime,
          teachers: free.map((teacher) => teacher.name),
          // Server-side only: booking attaches these, never the names (two
          // teachers can share a name). Stripped before a slot leaves here.
          teacherIds: free.map((teacher) => teacher._id),
        });
      }
    }
  }
  return slots.sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );
}

export async function getMeetingSlots(
  fromDate: string,
  toDate: string
): Promise<MeetingSlot[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromDate) || !/^\d{4}-\d{2}-\d{2}$/.test(toDate)) {
    return [];
  }
  try {
    return (await computeSlots(fromDate, toDate)).map(
      ({ teacherIds: _ids, ...slot }) => slot
    );
  } catch (error) {
    handleActionError("getMeetingSlots", error);
    return [];
  }
}

// ── Booking ───────────────────────────────────────────────────────────────

/**
 * Book one slot for the signed-in student. Re-checks everything the slot
 * list checked, then saves a "meeting" event shared with every teacher who
 * is free at that time (and the student's team, if asked). Teachers viewing
 * as a student book on that student's behalf, like everything else.
 */
export async function bookMeeting(
  data: BookMeetingInput
): Promise<ActionResult<{ id: string; teachers: string[] }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (isActingAsTeacher(session)) {
    return failure("Meetings are booked by students. Switch to a student view to book for someone.");
  }

  const validated = BookMeetingInputSchema.safeParse(data);
  if (!validated.success) {
    return invalidInput(validated.error);
  }
  const { date, startTime, topic, withTeam } = validated.data;

  try {
    const slot = (await computeSlots(date, date)).find(
      (candidate) => candidate.startTime === startTime
    );
    if (!slot) {
      return failure(
        "That time is no longer available. Pick another slot from the list."
      );
    }

    const studentId = new ObjectId(session.user.id);
    const attendees = [...slot.teacherIds];

    if (withTeam) {
      const team = await Team.findOne({ members: studentId }, { members: 1 })
        .sort({ _id: -1 })
        .lean<{ members: ObjectId[] } | null>();
      for (const member of team?.members ?? []) {
        if (String(member) !== String(studentId)) attendees.push(member);
      }
    }

    const created = await CalendarEvent.create({
      title: `Meeting: ${session.user.name}`,
      description: topic,
      category: "meeting",
      startDate: date,
      endDate: date,
      startTime,
      endTime: slot.endTime,
      owner: studentId,
      visibility: "shared",
      sharedWith: attendees,
    });

    // The check above and the save are two steps, so two students can pass
    // the check for the same time together. Look again now that ours is
    // saved: if an earlier meeting holds any of these teachers at this time,
    // ours gives way. Whichever was saved first keeps the slot, so exactly
    // one of the two survives.
    const sameDay = await CalendarEvent.find(
      {
        _id: { $lt: created._id },
        category: "meeting",
        startDate: date,
        $or: [
          { sharedWith: { $in: slot.teacherIds } },
          { owner: { $in: slot.teacherIds } },
        ],
      },
      { startTime: 1, endTime: 1 }
    ).lean<Array<{ startTime?: string; endTime?: string }>>();
    const taken = sameDay.some(
      (other) =>
        other.startTime &&
        timesOverlap(
          startTime,
          slot.endTime,
          other.startTime,
          other.endTime ??
            fromMinutes(toMinutes(other.startTime) + ASSUMED_MEETING_MINUTES)
        )
    );
    if (taken) {
      await CalendarEvent.deleteOne({ _id: created._id });
      return failure(
        "Someone booked that time a moment before you. Pick another slot from the list."
      );
    }
    revalidatePath(CALENDAR_PATH);
    return success(
      { id: String(created._id), teachers: slot.teachers },
      `Booked ${startTime} on ${date} with ${slot.teachers.join(" and ")}`
    );
  } catch (error) {
    return handleActionError("bookMeeting", error, "Failed to book the meeting");
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────

/** How far ahead the dashboard looks. */
const UPCOMING_DAYS = 14;

type UpcomingSheet = {
  _id: ObjectId;
  title: string;
  date: string;
  slots: Array<{
    startTime: string;
    endTime: string;
    claims: Array<{ team?: ObjectId | null; user: ObjectId }>;
  }>;
};

type MeetingRow = {
  _id: ObjectId;
  title: string;
  startDate: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  owner: { _id: ObjectId; name?: string; avatarUrl?: string } | null;
  sharedWith?: Array<{ _id: ObjectId; name?: string; role?: string }>;
};

/**
 * What the signed-in teacher has on from today, soonest first:
 * - booked meetings they attend (a booking names the teachers who were free,
 *   and those are the ones who need to turn up);
 * - meetings they set up themselves, e.g. from a "find a time" poll;
 * - every taken slot on a sign-up sheet they run or that is for a group
 *   project's teams, which is the running order of a review day.
 */
export async function getUpcomingMeetings(): Promise<UpcomingMeeting[]> {
  const session = await auth();
  if (!session?.user?.id || !isActingAsTeacher(session)) return [];
  const me = session.user.id;

  try {
    const today = todayKey();
    const until = addDays(today, UPCOMING_DAYS);
    const [rows, sheets] = await Promise.all([
      CalendarEvent.find({
        category: "meeting",
        $or: [{ sharedWith: new ObjectId(me) }, { owner: new ObjectId(me) }],
        startDate: { $gte: today, $lte: until },
      })
        .populate("owner", "name avatarUrl")
        .populate("sharedWith", "name role")
        .lean<MeetingRow[]>(),
      SignupSheet.find({
        date: { $gte: today, $lte: until },
        $or: [{ owner: new ObjectId(me) }, { audience: "project" }],
      }).lean<UpcomingSheet[]>(),
    ]);

    const teamNames = new Map<string, string>();
    const studentIds = rows.map((row) => row.owner?._id).filter(Boolean) as ObjectId[];
    if (studentIds.length > 0) {
      const teams = await Team.find(
        { members: { $in: studentIds } },
        { name: 1, members: 1 }
      ).lean<Array<{ name: string; members: ObjectId[] }>>();
      for (const row of rows) {
        // "With the team" bookings share with every teammate; spot that by
        // any non-teacher on the list and name the team they share.
        const teammates = (row.sharedWith ?? []).filter((p) => p.role !== "teacher");
        if (teammates.length === 0 || !row.owner) continue;
        const ownerId = String(row.owner._id);
        const team = teams.find((t) => t.members.some((m) => String(m) === ownerId));
        if (team) teamNames.set(String(row._id), team.name);
      }
    }

    const meetings: UpcomingMeeting[] = rows.map((row) => {
      const mine = row.owner && String(row.owner._id) === me;
      return {
        id: String(row._id),
        date: row.startDate,
        startTime: row.startTime ?? "",
        endTime: row.endTime ?? "",
        // A meeting the teacher set up is known by its title, not its owner.
        topic: mine ? "" : (row.description ?? ""),
        studentName: mine ? row.title : (row.owner?.name ?? "A student"),
        studentAvatarUrl: mine ? undefined : (row.owner?.avatarUrl ?? undefined),
        withTeachers: (row.sharedWith ?? [])
          .filter((p) => p.role === "teacher" && String(p._id) !== me)
          .map((p) => p.name ?? "A teacher"),
        teamName: teamNames.get(String(row._id)),
      };
    });

    // Sign-up sheets: one row per taken slot.
    const claimed = sheets.flatMap((sheet) =>
      sheet.slots.flatMap((slot) => slot.claims.map((claim) => ({ sheet, slot, claim })))
    );
    if (claimed.length > 0) {
      const [teams, people] = await Promise.all([
        Team.find(
          { _id: { $in: claimed.flatMap(({ claim }) => (claim.team ? [claim.team] : [])) } },
          { name: 1 }
        ).lean<Array<{ _id: ObjectId; name: string }>>(),
        User.find(
          { _id: { $in: claimed.map(({ claim }) => claim.user) } },
          { name: 1, avatarUrl: 1 }
        ).lean<Array<{ _id: ObjectId; name: string; avatarUrl?: string }>>(),
      ]);
      const teamName = new Map(teams.map((team) => [String(team._id), team.name]));
      const person = new Map(people.map((user) => [String(user._id), user]));
      for (const { sheet, slot, claim } of claimed) {
        const user = person.get(String(claim.user));
        meetings.push({
          id: `sheet-${sheet._id}-${slot.startTime}-${claim.team ?? claim.user}`,
          date: sheet.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          topic: sheet.title,
          studentName: claim.team
            ? (teamName.get(String(claim.team)) ?? "A team")
            : (user?.name ?? "A student"),
          studentAvatarUrl: claim.team ? undefined : (user?.avatarUrl ?? undefined),
          withTeachers: [],
        });
      }
    }

    return meetings.sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    );
  } catch (error) {
    handleActionError("getUpcomingMeetings", error);
    return [];
  }
}
