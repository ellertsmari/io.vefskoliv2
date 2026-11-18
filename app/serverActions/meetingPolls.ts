"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { auth } from "../../auth";
import { MeetingPoll } from "../models/meetingPoll";
import { CalendarEvent } from "../models/calendarEvent";
import { GroupProject } from "../models/groupProject";
import { Team } from "../models/team";
import { User } from "../models/user";
import { isActingAsTeacher } from "../utils/userUtils";
import { todayKey } from "../utils/calendarUtils";
import {
  MeetingPollInputSchema,
  fromMinutes,
  pollCells,
  toMinutes,
  type MeetingPollInput,
} from "../utils/meetingUtils";
import type { MeetingPollInfo, PollAudience } from "types/calendarTypes";
import {
  failure,
  success,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
  invalidInput,
} from "../utils/errors";

/**
 * "Find a time" polls.
 *
 * Permissions, enforced here; the UI only mirrors them.
 * - Anyone may start one, for everyone, their team, or people they pick.
 * - A poll is seen by its owner and by whoever it is for; each of them marks
 *   when they are free, and sees what the others marked.
 * - The owner (or a teacher who can see it) picks the time. That puts an
 *   ordinary meeting on the calendar of everyone asked and removes the poll.
 */

const CALENDAR_PATH = "/LMS/calendar";

type StoredResponse = { user: ObjectId; cells: string[]; at: Date };
type StoredPoll = {
  _id: ObjectId;
  title: string;
  description?: string;
  owner: ObjectId;
  days: string[];
  dayStart: string;
  dayEnd: string;
  lengthMinutes: number;
  audience: PollAudience;
  team?: ObjectId | null;
  sharedWith?: ObjectId[];
  responses: StoredResponse[];
};

const same = (a: unknown, b: unknown) => String(a) === String(b);

/** Polls whose last day has passed are of no use to anyone. */
const stillOpen = (poll: { days: string[] }) =>
  poll.days[poll.days.length - 1] >= todayKey();

/** Every open poll the viewer started or was asked on, soonest first. */
export async function getMeetingPolls(): Promise<MeetingPollInfo[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const viewerId = session.user.id;
  const viewer = new ObjectId(viewerId);
  const isTeacher = isActingAsTeacher(session);

  try {
    const myTeams = await Team.find({ members: viewer }, { _id: 1 }).lean<
      Array<{ _id: ObjectId }>
    >();
    const polls = (
      await MeetingPoll.find({
        $or: [
          { owner: viewer },
          { audience: "everyone" },
          { audience: "team", team: { $in: myTeams.map((team) => team._id) } },
          { audience: "shared", sharedWith: viewer },
        ],
      })
        .sort({ "days.0": 1, createdAt: 1 })
        .lean<StoredPoll[]>()
    ).filter(stillOpen);
    if (polls.length === 0) return [];

    const teams = await Team.find(
      { _id: { $in: polls.flatMap((poll) => (poll.team ? [poll.team] : [])) } },
      { name: 1, members: 1 }
    ).lean<Array<{ _id: ObjectId; name: string; members: ObjectId[] }>>();
    const teamById = new Map(teams.map((team) => [String(team._id), team]));

    const userIds = new Set<string>();
    for (const poll of polls) {
      userIds.add(String(poll.owner));
      for (const id of poll.sharedWith ?? []) userIds.add(String(id));
      for (const response of poll.responses) userIds.add(String(response.user));
    }
    const users = await User.find(
      { _id: { $in: [...userIds].map((id) => new ObjectId(id)) } },
      { name: 1 }
    ).lean<Array<{ _id: ObjectId; name: string }>>();
    const nameOf = new Map(users.map((user) => [String(user._id), user.name]));

    return polls.map((poll) => {
      const isOwner = same(poll.owner, viewerId);
      const team = poll.team ? teamById.get(String(poll.team)) : undefined;
      const asked =
        poll.audience === "team"
          ? new Set([String(poll.owner), ...(team?.members ?? []).map(String)])
          : poll.audience === "shared"
            ? new Set([String(poll.owner), ...(poll.sharedWith ?? []).map(String)])
            : null;
      return {
        id: String(poll._id),
        title: poll.title,
        description: poll.description,
        days: poll.days,
        dayStart: poll.dayStart,
        dayEnd: poll.dayEnd,
        lengthMinutes: poll.lengthMinutes,
        audience: poll.audience,
        audienceLabel:
          poll.audience === "everyone"
            ? "Everyone"
            : poll.audience === "team"
              ? (team?.name ?? "A team")
              : (poll.sharedWith ?? [])
                  .map((id) => nameOf.get(String(id)) ?? "Someone")
                  .join(", "),
        ownerName: nameOf.get(String(poll.owner)) ?? "Someone",
        isOwner,
        canManage: isOwner || isTeacher,
        responses: poll.responses.map((response) => ({
          id: String(response.user),
          name: nameOf.get(String(response.user)) ?? "Someone",
          cells: response.cells,
          mine: same(response.user, viewerId),
        })),
        answered: poll.responses.some((response) => same(response.user, viewerId)),
        invited: asked?.size,
      };
    });
  } catch (error) {
    handleActionError("getMeetingPolls", error);
    return [];
  }
}

/** The viewer's team on an active group project, else their newest team. */
const currentTeamOf = async (userId: string): Promise<ObjectId | null> => {
  const teams = await Team.find({ members: new ObjectId(userId) }, { project: 1 })
    .sort({ _id: -1 })
    .lean<Array<{ _id: ObjectId; project: ObjectId }>>();
  if (teams.length === 0) return null;
  const active = await GroupProject.find(
    { _id: { $in: teams.map((team) => team.project) }, status: "active" },
    { _id: 1 }
  ).lean<Array<{ _id: ObjectId }>>();
  const activeIds = new Set(active.map((project) => String(project._id)));
  return (teams.find((team) => activeIds.has(String(team.project))) ?? teams[0])._id;
};

export async function createMeetingPoll(
  data: MeetingPollInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  const userId = session.user.id;

  const validated = MeetingPollInputSchema.safeParse(data);
  if (!validated.success) return invalidInput(validated.error);
  const input = validated.data;
  const days = [...new Set(input.days)].sort();
  if (days[days.length - 1] < todayKey()) {
    return failure("Those days have already passed.", {
      days: ["Pick days from today on"],
    });
  }

  try {
    const target: { team?: ObjectId; sharedWith: ObjectId[] } = { sharedWith: [] };
    if (input.audience === "team") {
      const team = await currentTeamOf(userId);
      if (!team) return failure("You are not on a team right now; pick people instead.");
      target.team = team;
    } else if (input.audience === "shared") {
      const ids = [...new Set(input.sharedWith)].filter(
        (id) => ObjectId.isValid(id) && id !== userId
      );
      const found = await User.find(
        { _id: { $in: ids.map((id) => new ObjectId(id)) } },
        { _id: 1 }
      ).lean<Array<{ _id: ObjectId }>>();
      if (found.length === 0) return failure("Pick at least one person.");
      target.sharedWith = found.map((user) => user._id);
    }

    const created = await MeetingPoll.create({
      title: input.title,
      description: input.description,
      owner: new ObjectId(userId),
      days,
      dayStart: input.dayStart,
      dayEnd: input.dayEnd,
      lengthMinutes: input.lengthMinutes,
      audience: input.audience,
      ...target,
    });
    revalidatePath(CALENDAR_PATH);
    return success({ id: String(created._id) }, "Poll created");
  } catch (error) {
    return handleActionError("createMeetingPoll", error, "Failed to create the poll");
  }
}

/** The poll, when the viewer started it or was asked on it. */
const loadVisible = async (
  pollId: string,
  session: Session
): Promise<StoredPoll | null> => {
  if (!ObjectId.isValid(pollId)) return null;
  const poll = await MeetingPoll.findById(pollId).lean<StoredPoll | null>();
  if (!poll) return null;
  const userId = session.user.id;
  if (same(poll.owner, userId) || poll.audience === "everyone") return poll;
  if (poll.audience === "shared") {
    return (poll.sharedWith ?? []).some((id) => same(id, userId)) ? poll : null;
  }
  const onTeam = await Team.exists({ _id: poll.team, members: new ObjectId(userId) });
  return onTeam ? poll : null;
};

const mayManage = (poll: StoredPoll, session: Session) =>
  same(poll.owner, session.user.id) || isActingAsTeacher(session);

/** Save when the viewer is free; sending it again replaces the last answer. */
export async function savePollAvailability(
  pollId: string,
  cells: string[]
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!Array.isArray(cells) || cells.length > 2000) {
    return failure(ErrorMessages.INVALID_INPUT);
  }
  const user = new ObjectId(session.user.id);

  try {
    const poll = await loadVisible(pollId, session);
    if (!poll) return failure(ErrorMessages.NOT_FOUND("Poll"));
    // Keep only cells the poll asks about, whatever was sent.
    const asked = pollCells(poll);
    const kept = [...new Set(cells)].filter((cell) => asked.has(cell)).sort();

    const updated = await MeetingPoll.updateOne(
      { _id: poll._id, "responses.user": user },
      { $set: { "responses.$.cells": kept, "responses.$.at": new Date() } }
    );
    if (updated.matchedCount === 0) {
      await MeetingPoll.updateOne(
        { _id: poll._id, "responses.user": { $ne: user } },
        { $push: { responses: { user, cells: kept, at: new Date() } } }
      );
    }
    revalidatePath(CALENDAR_PATH);
    return successNoData("Saved");
  } catch (error) {
    return handleActionError("savePollAvailability", error, "Failed to save your times");
  }
}

/**
 * Pick the time. The meeting goes on the calendar of everyone who was asked
 * (as an ordinary event the organiser can edit or delete) and the poll is
 * removed: it has done its job.
 */
export async function schedulePoll(
  pollId: string,
  date: string,
  startTime: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);

  try {
    const poll = await loadVisible(pollId, session);
    if (!poll) return failure(ErrorMessages.NOT_FOUND("Poll"));
    if (!mayManage(poll, session)) return failure(ErrorMessages.NOT_AUTHORIZED);
    if (!poll.days.includes(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      return failure("That time is not on the poll.");
    }
    const start = toMinutes(startTime);
    if (
      start < toMinutes(poll.dayStart) ||
      start + poll.lengthMinutes > toMinutes(poll.dayEnd)
    ) {
      return failure("That time is outside the hours the poll asks about.");
    }

    // Deleting first means two clicks cannot schedule the meeting twice.
    const removed = await MeetingPoll.deleteOne({ _id: poll._id });
    if (removed.deletedCount === 0) return failure(ErrorMessages.NOT_FOUND("Poll"));

    await CalendarEvent.create({
      title: poll.title,
      description: poll.description,
      category: "meeting",
      startDate: date,
      endDate: date,
      startTime,
      endTime: fromMinutes(start + poll.lengthMinutes),
      owner: poll.owner,
      visibility: poll.audience,
      team: poll.audience === "team" ? poll.team : undefined,
      sharedWith: poll.audience === "shared" ? poll.sharedWith : [],
    });
    revalidatePath(CALENDAR_PATH);
    return successNoData(`Scheduled for ${startTime}`);
  } catch (error) {
    return handleActionError("schedulePoll", error, "Failed to schedule the meeting");
  }
}

export async function deleteMeetingPoll(pollId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  try {
    const poll = await loadVisible(pollId, session);
    if (!poll) return failure(ErrorMessages.NOT_FOUND("Poll"));
    if (!mayManage(poll, session)) return failure(ErrorMessages.NOT_AUTHORIZED);
    await MeetingPoll.deleteOne({ _id: poll._id });
    revalidatePath(CALENDAR_PATH);
    return successNoData("Poll deleted");
  } catch (error) {
    return handleActionError("deleteMeetingPoll", error, "Failed to delete the poll");
  }
}
