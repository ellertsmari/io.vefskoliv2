"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { BookingWindow } from "../models/bookingWindow";
import { CalendarEvent } from "../models/calendarEvent";
import { Team } from "../models/team";
import { User } from "../models/user";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions, isActingAsTeacher } from "../utils/userUtils";
import {
  BookMeetingInputSchema,
  BookingWindowInputSchema,
  MEETING_SLOT_MINUTES,
  MIN_TEACHERS_PRESENT,
  addDays,
  addMinutes,
  slotStarts,
  timesOverlap,
  todayKey,
  weekdayOf,
  type BookMeetingInput,
  type BookingWindowInput,
} from "../utils/calendarUtils";
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
  validFrom: string;
  validTo: string;
};

const toInfo = (row: WindowRow): BookingWindowInfo => ({
  id: String(row._id),
  weekday: row.weekday,
  startTime: row.startTime,
  endTime: row.endTime,
  validFrom: row.validFrom,
  validTo: row.validTo,
});

export async function getBookingWindows(): Promise<BookingWindowInfo[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  try {
    await connectToDatabase();
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
  if (!hasTeacherPermissions(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = BookingWindowInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  try {
    await connectToDatabase();
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
  if (!hasTeacherPermissions(session)) return failure(ErrorMessages.NOT_AUTHORIZED);
  if (!ObjectId.isValid(windowId)) return failure(ErrorMessages.NOT_FOUND("Meeting hours"));

  try {
    await connectToDatabase();
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

type BusyRow = {
  owner: ObjectId | null;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
};

type BookedRow = { startDate: string; startTime?: string };

/**
 * Which teachers are free for one slot: no "not available" event covering
 * it. An event without times blocks the whole day.
 */
const freeTeachers = (
  teachers: Teacher[],
  busy: BusyRow[],
  date: string,
  startTime: string,
  endTime: string
): Teacher[] =>
  teachers.filter(
    (teacher) =>
      !busy.some(
        (block) =>
          block.owner &&
          String(block.owner) === String(teacher._id) &&
          block.startDate <= date &&
          block.endDate >= date &&
          (!block.startTime ||
            timesOverlap(startTime, endTime, block.startTime, block.endTime ?? "23:59"))
      )
  );

/**
 * Every bookable slot between two dates. A slot is offered when it lies in
 * a meeting-hours window, is in the future, nobody has booked it, and at
 * least MIN_TEACHERS_PRESENT teachers are free.
 */
async function computeSlots(fromDate: string, toDate: string): Promise<MeetingSlot[]> {
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

  const [busy, booked] = await Promise.all([
    CalendarEvent.find(
      {
        category: "unavailable",
        startDate: { $lte: toDate },
        endDate: { $gte: fromDate },
      },
      { owner: 1, startDate: 1, endDate: 1, startTime: 1, endTime: 1 }
    ).lean<BusyRow[]>(),
    CalendarEvent.find(
      { category: "meeting", startDate: { $gte: fromDate, $lte: toDate } },
      { startDate: 1, startTime: 1 }
    ).lean<BookedRow[]>(),
  ]);
  const taken = new Set(booked.map((row) => `${row.startDate} ${row.startTime}`));

  const now = new Date();
  const today = todayKey();
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const slots: MeetingSlot[] = [];
  for (let date = fromDate, i = 0; date <= toDate && i < MAX_RANGE_DAYS; date = addDays(date, 1), i++) {
    if (date < today) continue;
    const weekday = weekdayOf(date);
    for (const window of windows) {
      if (window.weekday !== weekday) continue;
      if (date < window.validFrom || date > window.validTo) continue;
      for (const startTime of slotStarts(window.startTime, window.endTime)) {
        if (date === today && startTime <= nowTime) continue;
        if (taken.has(`${date} ${startTime}`)) continue;
        const endTime = addMinutes(startTime, MEETING_SLOT_MINUTES);
        const free = freeTeachers(teachers, busy, date, startTime, endTime);
        if (free.length < MIN_TEACHERS_PRESENT) continue;
        slots.push({
          date,
          startTime,
          endTime,
          teachers: free.map((teacher) => teacher.name),
        });
      }
    }
  }
  return slots;
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
    await connectToDatabase();
    return await computeSlots(fromDate, toDate);
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
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { date, startTime, topic, withTeam } = validated.data;

  try {
    await connectToDatabase();
    const slot = (await computeSlots(date, date)).find(
      (candidate) => candidate.startTime === startTime
    );
    if (!slot) {
      return failure(
        "That time is no longer available. Pick another slot from the list."
      );
    }

    const teachers = await User.find(
      { role: "teacher", status: { $ne: "pending" }, name: { $in: slot.teachers } },
      { _id: 1 }
    ).lean<Array<{ _id: ObjectId }>>();
    const studentId = new ObjectId(session.user.id);
    const attendees = teachers.map((teacher) => teacher._id);

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

type MeetingRow = {
  _id: ObjectId;
  startDate: string;
  startTime?: string;
  endTime?: string;
  description?: string;
  owner: { _id: ObjectId; name?: string; avatarUrl?: string } | null;
  sharedWith?: Array<{ _id: ObjectId; name?: string; role?: string }>;
};

/**
 * The signed-in teacher's booked meetings from today on, soonest first.
 * Only meetings they are attending: a booking names the teachers who were
 * free, and those are the ones who need to turn up.
 */
export async function getUpcomingMeetings(): Promise<UpcomingMeeting[]> {
  const session = await auth();
  if (!session?.user?.id || !hasTeacherPermissions(session)) return [];
  const me = session.user.id;

  try {
    await connectToDatabase();
    const today = todayKey();
    const rows = await CalendarEvent.find({
      category: "meeting",
      sharedWith: new ObjectId(me),
      startDate: { $gte: today, $lte: addDays(today, UPCOMING_DAYS) },
    })
      .sort({ startDate: 1, startTime: 1 })
      .populate("owner", "name avatarUrl")
      .populate("sharedWith", "name role")
      .lean<MeetingRow[]>();

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

    return rows.map((row) => ({
      id: String(row._id),
      date: row.startDate,
      startTime: row.startTime ?? "",
      endTime: row.endTime ?? "",
      topic: row.description ?? "",
      studentName: row.owner?.name ?? "A student",
      studentAvatarUrl: row.owner?.avatarUrl ?? undefined,
      withTeachers: (row.sharedWith ?? [])
        .filter((p) => p.role === "teacher" && String(p._id) !== me)
        .map((p) => p.name ?? "A teacher"),
      teamName: teamNames.get(String(row._id)),
    }));
  } catch (error) {
    handleActionError("getUpcomingMeetings", error);
    return [];
  }
}
