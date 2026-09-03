"use server";

import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { auth } from "../../auth";
import { CalendarEvent } from "../models/calendarEvent";
import { Team } from "../models/team";
import { GroupProject } from "../models/groupProject";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions, isActingAsTeacher } from "../utils/userUtils";
import {
  CalendarEventInputSchema,
  CopyEventsInputSchema,
  addDays,
  canEditEvent,
  expandWeekly,
  normalizeEventInput,
  type CalendarEventInput,
  type CopyEventsInput,
} from "../utils/calendarUtils";
import {
  PLAN_IMPORT_PREFIX,
  SEMESTER_PLAN_2026,
} from "../constants/semesterPlan";
import type {
  CalendarEvent as ClientEvent,
  EventVisibility,
} from "types/calendarTypes";
import {
  failure,
  success,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

/**
 * Calendar permissions, enforced here; the UI only mirrors them.
 * - Teachers create events for everyone and may edit or delete any event.
 * - Students create events for themselves or their team, and may edit or
 *   delete only their own.
 * - Students see everyone's events, their own, and their teams'.
 */

type StoredEvent = {
  _id: ObjectId;
  title: string;
  description?: string;
  category: ClientEvent["category"];
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  link?: string;
  owner: { _id: ObjectId; name?: string; role?: string; avatarUrl?: string } | null;
  visibility: EventVisibility;
  team?: { _id: ObjectId; name?: string } | null;
  seriesId?: string;
};

const CALENDAR_PATH = "/LMS/calendar";

const teamIdsOf = async (userId: string): Promise<ObjectId[]> => {
  const teams = await Team.find({ members: new ObjectId(userId) }, { _id: 1 }).lean<
    Array<{ _id: ObjectId }>
  >();
  return teams.map((team) => team._id);
};

/**
 * The team a student's "team" events belong to: their team on the active
 * group project when there is one, otherwise their most recent team.
 */
const currentTeamOf = async (
  userId: string
): Promise<{ _id: ObjectId; name: string } | null> => {
  const teams = await Team.find(
    { members: new ObjectId(userId) },
    { name: 1, project: 1 }
  )
    .sort({ _id: -1 })
    .lean<Array<{ _id: ObjectId; name: string; project: ObjectId }>>();
  if (teams.length === 0) return null;

  const active = await GroupProject.find(
    { _id: { $in: teams.map((team) => team.project) }, status: "active" },
    { _id: 1 }
  ).lean<Array<{ _id: ObjectId }>>();
  const activeIds = new Set(active.map((project) => String(project._id)));
  const onActive = teams.find((team) => activeIds.has(String(team.project)));
  const chosen = onActive ?? teams[0];
  return { _id: chosen._id, name: chosen.name };
};

const toClientEvent = (
  event: StoredEvent,
  viewerId: string,
  isTeacher: boolean
): ClientEvent => {
  const ownerId = event.owner ? String(event.owner._id) : null;
  const ownerLabel = !event.owner
    ? "Vefskólinn"
    : event.visibility === "team" && event.team?.name
      ? `${event.team.name}`
      : ownerId === viewerId
        ? "You"
        : (event.owner.name ?? "Unknown");
  return {
    id: String(event._id),
    date: event.startDate,
    endDate: event.endDate > event.startDate ? event.endDate : undefined,
    title: event.title,
    category: event.category,
    time: event.startTime,
    endTime: event.endTime,
    description: event.description,
    link: event.link,
    source: !event.owner || event.owner.role === "teacher" ? "school" : "user",
    visibility: event.visibility,
    ownerLabel,
    ownerName: event.owner?.name,
    ownerAvatarUrl: event.owner?.avatarUrl ?? undefined,
    canEdit: canEditEvent(isTeacher, viewerId, { owner: ownerId }),
    seriesId: event.seriesId,
  };
};

/** The name of the team a student's "team" events would go to, if any. */
export async function getViewerTeamName(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  try {
    await connectToDatabase();
    const team = await currentTeamOf(session.user.id);
    return team?.name ?? null;
  } catch (error) {
    handleActionError("getViewerTeamName", error);
    return null;
  }
}

/** Every event the current viewer may see, oldest first. */
export async function getCalendarEvents(): Promise<ClientEvent[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const viewerId = session.user.id;
  const isTeacher = isActingAsTeacher(session);

  try {
    await connectToDatabase();
    const filter = isTeacher
      ? {}
      : {
          $or: [
            { visibility: "everyone" },
            { owner: new ObjectId(viewerId) },
            { visibility: "team", team: { $in: await teamIdsOf(viewerId) } },
          ],
        };
    const rows = await CalendarEvent.find(filter)
      .sort({ startDate: 1, startTime: 1 })
      .populate("owner", "name role avatarUrl")
      .populate("team", "name")
      .lean<StoredEvent[]>();
    return rows.map((row) => toClientEvent(row, viewerId, isTeacher));
  } catch (error) {
    handleActionError("getCalendarEvents", error);
    return [];
  }
}

/**
 * Decide who an event is for. Teachers publish to everyone. Students choose
 * private or team; "team" needs a team to attach to.
 */
const resolveAudience = async (
  requested: EventVisibility | undefined,
  isTeacher: boolean,
  userId: string
): Promise<
  | { ok: true; visibility: EventVisibility; team: ObjectId | null }
  | { ok: false; message: string }
> => {
  if (isTeacher) return { ok: true, visibility: "everyone", team: null };
  const visibility = requested ?? "private";
  if (visibility === "everyone") {
    return {
      ok: false,
      message: "Students can share an event with their team or keep it private.",
    };
  }
  if (visibility === "team") {
    const team = await currentTeamOf(userId);
    if (!team) {
      return {
        ok: false,
        message: "You are not on a team right now, so this can only be private.",
      };
    }
    return { ok: true, visibility, team: team._id };
  }
  return { ok: true, visibility, team: null };
};

export async function createCalendarEvent(
  data: CalendarEventInput
): Promise<ActionResult<{ count: number }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  const isTeacher = isActingAsTeacher(session);

  const validated = CalendarEventInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const input = validated.data;
  const base = normalizeEventInput(input);

  try {
    await connectToDatabase();
    const audience = await resolveAudience(input.visibility, isTeacher, session.user.id);
    if (!audience.ok) return failure(audience.message);

    const occurrences = input.repeatWeeklyUntil
      ? expandWeekly(base.startDate, base.endDate, input.repeatWeeklyUntil)
      : [{ startDate: base.startDate, endDate: base.endDate }];
    const seriesId = occurrences.length > 1 ? randomUUID() : undefined;

    await CalendarEvent.insertMany(
      occurrences.map((occurrence) => ({
        ...base,
        ...occurrence,
        owner: new ObjectId(session.user.id),
        visibility: audience.visibility,
        team: audience.team,
        seriesId,
      }))
    );
    revalidatePath(CALENDAR_PATH);
    const count = occurrences.length;
    return success({ count }, count === 1 ? "Event added" : `${count} events added`);
  } catch (error) {
    return handleActionError("createCalendarEvent", error, "Failed to add the event");
  }
}

const loadEditable = async (eventId: string, session: Session) => {
  if (!ObjectId.isValid(eventId)) return null;
  const event = await CalendarEvent.findById(eventId).lean<{
    _id: ObjectId;
    owner: ObjectId | null;
    visibility: EventVisibility;
    team?: ObjectId | null;
    seriesId?: string;
  }>();
  if (!event) return null;
  const isTeacher = isActingAsTeacher(session);
  if (!canEditEvent(isTeacher, session.user.id, event)) return "forbidden";
  return event;
};

export async function updateCalendarEvent(
  eventId: string,
  data: CalendarEventInput,
  options: { applyToSeries?: boolean } = {}
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  const isTeacher = isActingAsTeacher(session);

  const validated = CalendarEventInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const input = validated.data;
  const base = normalizeEventInput(input);

  try {
    await connectToDatabase();
    const event = await loadEditable(eventId, session);
    if (!event) return failure(ErrorMessages.NOT_FOUND("Event"));
    if (event === "forbidden") {
      return failure("You can only edit events you created yourself");
    }

    // A teacher editing a student's event leaves its audience alone.
    let visibility = event.visibility;
    let team = event.team ?? null;
    if (!isTeacher) {
      const audience = await resolveAudience(input.visibility, false, session.user.id);
      if (!audience.ok) return failure(audience.message);
      visibility = audience.visibility;
      team = audience.team;
    }

    if (options.applyToSeries && event.seriesId) {
      // Dates stay per occurrence; everything else follows the series.
      const { startDate: _s, endDate: _e, ...shared } = base;
      await CalendarEvent.updateMany(
        { seriesId: event.seriesId },
        { $set: { ...shared, visibility, team }, $unset: unsetMissing(shared) }
      );
    } else {
      await CalendarEvent.updateOne(
        { _id: event._id },
        { $set: { ...base, visibility, team }, $unset: unsetMissing(base) }
      );
    }
    revalidatePath(CALENDAR_PATH);
    return successNoData("Event updated");
  } catch (error) {
    return handleActionError("updateCalendarEvent", error, "Failed to update the event");
  }
}

/** Fields the form left empty are removed, not left at their old value. */
const unsetMissing = (fields: Record<string, unknown>) =>
  Object.fromEntries(
    ["description", "startTime", "endTime", "link"]
      .filter((key) => fields[key] === undefined)
      .map((key) => [key, ""])
  );

export async function deleteCalendarEvent(
  eventId: string,
  options: { applyToSeries?: boolean } = {}
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    await connectToDatabase();
    const event = await loadEditable(eventId, session);
    if (!event) return failure(ErrorMessages.NOT_FOUND("Event"));
    if (event === "forbidden") {
      return failure("You can only delete events you created yourself");
    }

    if (options.applyToSeries && event.seriesId) {
      await CalendarEvent.deleteMany({ seriesId: event.seriesId });
    } else {
      await CalendarEvent.deleteOne({ _id: event._id });
    }
    revalidatePath(CALENDAR_PATH);
    return successNoData("Event deleted");
  } catch (error) {
    return handleActionError("deleteCalendarEvent", error, "Failed to delete the event");
  }
}

/**
 * Put the built-in semester plan into the calendar. Safe to run again: every
 * plan entry has a fixed import key, so only missing ones are added.
 */
export async function importSemesterPlan(): Promise<ActionResult<{ added: number }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!hasTeacherPermissions(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  try {
    await connectToDatabase();
    const result = await CalendarEvent.bulkWrite(
      SEMESTER_PLAN_2026.map((event) => ({
        updateOne: {
          filter: { importKey: `${PLAN_IMPORT_PREFIX}:${event.id}` },
          update: {
            $setOnInsert: {
              title: event.title,
              description: event.description,
              category: event.category,
              startDate: event.date,
              endDate: event.endDate ?? event.date,
              startTime: event.time,
              owner: null,
              visibility: "everyone",
              importKey: `${PLAN_IMPORT_PREFIX}:${event.id}`,
            },
          },
          upsert: true,
        },
      }))
    );
    revalidatePath(CALENDAR_PATH);
    const added = result.upsertedCount;
    return success(
      { added },
      added === 0 ? "The plan is already in the calendar" : `${added} events added`
    );
  } catch (error) {
    return handleActionError("importSemesterPlan", error, "Failed to import the plan");
  }
}

/**
 * Copy last term's shared events forward, e.g. 52 weeks so every lecture
 * lands on the same weekday. Copies carry an import key, so copying the same
 * range twice adds nothing the second time.
 */
export async function copyCalendarEvents(
  data: CopyEventsInput
): Promise<ActionResult<{ added: number }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!hasTeacherPermissions(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = CopyEventsInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { fromDate, toDate, weeks } = validated.data;

  try {
    await connectToDatabase();
    const sources = await CalendarEvent.find({
      visibility: "everyone",
      startDate: { $gte: fromDate, $lte: toDate },
    }).lean<
      Array<{
        _id: ObjectId;
        title: string;
        description?: string;
        category: ClientEvent["category"];
        startDate: string;
        endDate: string;
        startTime?: string;
        endTime?: string;
        link?: string;
      }>
    >();
    if (sources.length === 0) return success({ added: 0 }, "No events in that range");

    const result = await CalendarEvent.bulkWrite(
      sources.map((source) => {
        const importKey = `copy:${source._id}:${weeks}`;
        return {
          updateOne: {
            filter: { importKey },
            update: {
              $setOnInsert: {
                title: source.title,
                description: source.description,
                category: source.category,
                startDate: addDays(source.startDate, weeks * 7),
                endDate: addDays(source.endDate, weeks * 7),
                startTime: source.startTime,
                endTime: source.endTime,
                link: source.link,
                owner: null,
                visibility: "everyone",
                importKey,
              },
            },
            upsert: true,
          },
        };
      })
    );
    revalidatePath(CALENDAR_PATH);
    const added = result.upsertedCount;
    return success(
      { added },
      added === 0 ? "Those events were already copied" : `${added} events copied`
    );
  } catch (error) {
    return handleActionError("copyCalendarEvents", error, "Failed to copy events");
  }
}
