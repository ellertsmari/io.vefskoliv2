"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { auth } from "../../auth";
import { SignupSheet } from "../models/signupSheet";
import { GroupProject } from "../models/groupProject";
import { Team } from "../models/team";
import { User } from "../models/user";
import { isActingAsTeacher } from "../utils/userUtils";
import { addDays, todayKey } from "../utils/calendarUtils";
import {
  SignupSheetInputSchema,
  fromMinutes,
  slotsProblem,
  toMinutes,
  type SignupSheetInput,
} from "../utils/meetingUtils";
import type {
  SignupAudience,
  SignupSheetInfo,
  SignupTargets,
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

/**
 * Sign-up sheets: a day of time slots that teams or people claim.
 *
 * Permissions, enforced here; the UI only mirrors them.
 * - Anyone may create one. Only teachers may create one for the teams of a
 *   group project.
 * - A sheet is seen by its owner and by whoever it is for. Teachers also see
 *   every group-project sheet.
 * - Whoever it is for takes one slot (a team takes one together), and may
 *   move or give it back until it starts.
 * - The owner and teachers may clear, move and assign slots at any time.
 */

const CALENDAR_PATH = "/LMS/calendar";

/** Finished sheets stay listed for whoever runs them for this long. */
const KEEP_PAST_DAYS = 14;

type StoredClaim = { team?: ObjectId | null; user: ObjectId; at: Date };
type StoredSlot = { startTime: string; endTime: string; claims: StoredClaim[] };
type StoredSheet = {
  _id: ObjectId;
  title: string;
  description?: string;
  owner: ObjectId;
  date: string;
  slotMinutes: number;
  capacity: number;
  audience: SignupAudience;
  project?: ObjectId | null;
  team?: ObjectId | null;
  sharedWith?: ObjectId[];
  slots: StoredSlot[];
  version: number;
};

type TeamRow = { _id: ObjectId; name: string; project: ObjectId; members: ObjectId[] };

const same = (a: unknown, b: unknown) => String(a) === String(b);

const nowTime = () => {
  const now = new Date();
  return fromMinutes(now.getHours() * 60 + now.getMinutes());
};

/** A slot nobody can sign up to any more: it has started. */
const hasStarted = (date: string, startTime: string): boolean => {
  const today = todayKey();
  return date < today || (date === today && startTime <= nowTime());
};

/** The id a claim is held under: the team on a team sheet, else the person. */
const claimKey = (claim: StoredClaim) => String(claim.team ?? claim.user);

// ── Reading ───────────────────────────────────────────────────────────────

/** Every sheet the viewer runs or is invited to, soonest first. */
export async function getSignupSheets(): Promise<SignupSheetInfo[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const viewerId = session.user.id;
  const viewer = new ObjectId(viewerId);
  const isTeacher = isActingAsTeacher(session);

  try {
    const myTeams = await Team.find(
      { members: viewer },
      { name: 1, project: 1, members: 1 }
    ).lean<TeamRow[]>();

    const today = todayKey();
    const sheets = await SignupSheet.find({
      date: { $gte: addDays(today, -KEEP_PAST_DAYS) },
      $or: [
        { owner: viewer },
        { audience: "everyone" },
        { audience: "team", team: { $in: myTeams.map((team) => team._id) } },
        { audience: "shared", sharedWith: viewer },
        isTeacher
          ? { audience: "project" }
          : { audience: "project", project: { $in: myTeams.map((team) => team.project) } },
      ],
    })
      .sort({ date: 1, "slots.0.startTime": 1 })
      .lean<StoredSheet[]>();
    if (sheets.length === 0) return [];

    // One lookup each for the projects, teams and people the sheets mention.
    const projectIds = sheets.flatMap((sheet) => (sheet.project ? [sheet.project] : []));
    const teamIds = sheets.flatMap((sheet) => (sheet.team ? [sheet.team] : []));
    const [projects, projectTeams, audienceTeams] = await Promise.all([
      GroupProject.find({ _id: { $in: projectIds } }, { title: 1 }).lean<
        Array<{ _id: ObjectId; title: string }>
      >(),
      Team.find(
        { project: { $in: projectIds } },
        { name: 1, project: 1, members: 1 }
      ).lean<TeamRow[]>(),
      Team.find({ _id: { $in: teamIds } }, { name: 1 }).lean<
        Array<{ _id: ObjectId; name: string }>
      >(),
    ]);
    const userIds = new Set<string>();
    for (const sheet of sheets) {
      userIds.add(String(sheet.owner));
      for (const id of sheet.sharedWith ?? []) userIds.add(String(id));
      for (const slot of sheet.slots) {
        for (const claim of slot.claims) userIds.add(String(claim.user));
      }
    }
    for (const team of projectTeams) {
      for (const member of team.members) userIds.add(String(member));
    }
    const users = await User.find(
      { _id: { $in: [...userIds].map((id) => new ObjectId(id)) } },
      { name: 1 }
    ).lean<Array<{ _id: ObjectId; name: string }>>();
    const nameOf = new Map(users.map((user) => [String(user._id), user.name]));
    const projectTitle = new Map(projects.map((p) => [String(p._id), p.title]));
    const teamById = new Map(projectTeams.map((team) => [String(team._id), team]));
    const teamName = new Map(audienceTeams.map((team) => [String(team._id), team.name]));

    const result: SignupSheetInfo[] = [];
    for (const sheet of sheets) {
      const isOwner = same(sheet.owner, viewerId);
      const canManage = isOwner || isTeacher;
      if (!canManage && sheet.date < today) continue;

      const byTeam = sheet.audience === "project";
      const myTeam = byTeam
        ? projectTeams.find(
            (team) =>
              same(team.project, sheet.project) &&
              team.members.some((member) => same(member, viewerId))
          )
        : undefined;
      // On a team sheet only a team can hold a slot; a teacher assigns.
      const canSignUp = byTeam ? !!myTeam : true;
      const myKey = byTeam ? (myTeam ? String(myTeam._id) : null) : viewerId;

      const audienceLabel =
        sheet.audience === "project"
          ? `Teams of ${projectTitle.get(String(sheet.project)) ?? "a group project"}`
          : sheet.audience === "everyone"
            ? "Everyone"
            : sheet.audience === "team"
              ? (teamName.get(String(sheet.team)) ?? "A team")
              : (sheet.sharedWith ?? [])
                  .map((id) => nameOf.get(String(id)) ?? "Someone")
                  .join(", ");

      const slots = sheet.slots.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        claims: slot.claims.map((claim) => {
          const key = claimKey(claim);
          const team = claim.team ? teamById.get(String(claim.team)) : undefined;
          return {
            id: key,
            label: claim.team
              ? (team?.name ?? "A team")
              : (nameOf.get(String(claim.user)) ?? "Someone"),
            members: team?.members.map(
              (member) => nameOf.get(String(member)) ?? "Someone"
            ),
            mine: key === myKey,
          };
        }),
        full: slot.claims.length >= sheet.capacity,
        past: hasStarted(sheet.date, slot.startTime),
      }));

      const taken = new Set(
        sheet.slots.flatMap((slot) => slot.claims.map(claimKey))
      );
      result.push({
        id: String(sheet._id),
        title: sheet.title,
        description: sheet.description,
        date: sheet.date,
        slotMinutes: sheet.slotMinutes,
        capacity: sheet.capacity,
        audience: sheet.audience,
        byTeam,
        audienceLabel,
        ownerName: nameOf.get(String(sheet.owner)) ?? "Someone",
        isOwner,
        canManage,
        canSignUp,
        signUpAs: myTeam?.name,
        mySlot: slots.find((slot) => slot.claims.some((claim) => claim.mine))?.startTime,
        slots,
        waiting:
          canManage && byTeam
            ? projectTeams
                .filter(
                  (team) =>
                    same(team.project, sheet.project) && !taken.has(String(team._id))
                )
                .map((team) => ({ id: String(team._id), label: team.name }))
            : undefined,
      });
    }
    return result;
  } catch (error) {
    handleActionError("getSignupSheets", error);
    return [];
  }
}

/** What the "new sign-up sheet" form may offer the viewer. */
export async function getSignupTargets(): Promise<SignupTargets> {
  const empty: SignupTargets = { projects: [], teamName: null };
  const session = await auth();
  if (!session?.user?.id) return empty;

  try {
    if (!isActingAsTeacher(session)) {
      const team = await currentTeamOf(session.user.id);
      return { projects: [], teamName: team?.name ?? null };
    }
    const projects = await GroupProject.find(
      { status: { $ne: "archived" } },
      { title: 1 }
    )
      .sort({ startDate: -1 })
      .lean<Array<{ _id: ObjectId; title: string }>>();
    const counts = await Team.aggregate<{ _id: ObjectId; teams: number }>([
      { $match: { project: { $in: projects.map((project) => project._id) } } },
      { $group: { _id: "$project", teams: { $sum: 1 } } },
    ]);
    const teamsOf = new Map(counts.map((row) => [String(row._id), row.teams]));
    return {
      projects: projects
        .map((project) => ({
          id: String(project._id),
          title: project.title,
          teams: teamsOf.get(String(project._id)) ?? 0,
        }))
        .filter((project) => project.teams > 0),
      teamName: null,
    };
  } catch (error) {
    handleActionError("getSignupTargets", error);
    return empty;
  }
}

/** The viewer's team on an active group project, else their newest team. */
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
  return teams.find((team) => activeIds.has(String(team.project))) ?? teams[0];
};

// ── Creating and deleting ─────────────────────────────────────────────────

export async function createSignupSheet(
  data: SignupSheetInput
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  const isTeacher = isActingAsTeacher(session);
  const userId = session.user.id;

  const validated = SignupSheetInputSchema.safeParse(data);
  if (!validated.success) return invalidInput(validated.error);
  const input = validated.data;

  try {
    const target: {
      project?: ObjectId;
      team?: ObjectId;
      sharedWith: ObjectId[];
    } = { sharedWith: [] };

    if (input.audience === "project") {
      if (!isTeacher) {
        return failure("Only teachers can make a sheet for a group project's teams.");
      }
      if (!input.projectId || !ObjectId.isValid(input.projectId)) {
        return failure(ErrorMessages.NOT_FOUND("Group project"));
      }
      const project = await GroupProject.exists({ _id: input.projectId });
      if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
      target.project = new ObjectId(input.projectId);
    } else if (input.audience === "team") {
      const team = await currentTeamOf(userId);
      if (!team) {
        return failure("You are not on a team right now; pick people instead.");
      }
      target.team = team._id;
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

    const created = await SignupSheet.create({
      title: input.title,
      description: input.description,
      owner: new ObjectId(userId),
      date: input.date,
      slotMinutes: input.slotMinutes,
      // A team takes its slot alone.
      capacity: input.audience === "project" ? 1 : input.capacity,
      audience: input.audience,
      ...target,
      slots: [...input.slots].sort().map((startTime) => ({
        startTime,
        endTime: fromMinutes(toMinutes(startTime) + input.slotMinutes),
        claims: [],
      })),
    });
    revalidatePath(CALENDAR_PATH);
    return success({ id: String(created._id) }, "Sign-up sheet created");
  } catch (error) {
    return handleActionError("createSignupSheet", error, "Failed to create the sheet");
  }
}

const loadSheet = async (sheetId: string): Promise<StoredSheet | null> => {
  if (!ObjectId.isValid(sheetId)) return null;
  return SignupSheet.findById(sheetId).lean<StoredSheet | null>();
};

const mayManage = (sheet: StoredSheet, session: Session) =>
  same(sheet.owner, session.user.id) || isActingAsTeacher(session);

/** Whether the viewer is one of the people the sheet is for (or runs it). */
const maySee = async (sheet: StoredSheet, session: Session): Promise<boolean> => {
  const userId = session.user.id;
  if (same(sheet.owner, userId) || sheet.audience === "everyone") return true;
  if (sheet.audience === "shared") {
    return (sheet.sharedWith ?? []).some((id) => same(id, userId));
  }
  if (sheet.audience === "team") {
    return !!(await Team.exists({ _id: sheet.team, members: new ObjectId(userId) }));
  }
  if (isActingAsTeacher(session)) return true;
  return !!(await Team.exists({
    project: sheet.project,
    members: new ObjectId(userId),
  }));
};

export async function deleteSignupSheet(sheetId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  try {
    const sheet = await loadSheet(sheetId);
    if (!sheet || !(await maySee(sheet, session))) {
      return failure(ErrorMessages.NOT_FOUND("Sign-up sheet"));
    }
    if (!mayManage(sheet, session)) return failure(ErrorMessages.NOT_AUTHORIZED);
    await SignupSheet.deleteOne({ _id: sheet._id });
    revalidatePath(CALENDAR_PATH);
    return successNoData("Sign-up sheet deleted");
  } catch (error) {
    return handleActionError("deleteSignupSheet", error, "Failed to delete the sheet");
  }
}

// ── Changing slots ────────────────────────────────────────────────────────

/** How often a change is retried when someone else changed the sheet first. */
const MAX_ATTEMPTS = 5;

/**
 * Apply a change to a sheet's slots as a compare-and-swap on `version`.
 * `change` edits the slots in place and returns a message to refuse with, or
 * null to save. When another change got in first, the sheet is read again and
 * the change re-applied to what is there now.
 */
const changeSlots = async (
  sheetId: string,
  session: Session,
  change: (sheet: StoredSheet) => Promise<string | null> | string | null,
  done: string
): Promise<ActionResult<void>> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const sheet = await loadSheet(sheetId);
    if (!sheet || !(await maySee(sheet, session))) {
      return failure(ErrorMessages.NOT_FOUND("Sign-up sheet"));
    }
    const refused = await change(sheet);
    if (refused) return failure(refused);
    const saved = await SignupSheet.updateOne(
      { _id: sheet._id, version: sheet.version },
      { $set: { slots: sheet.slots }, $inc: { version: 1 } }
    );
    if (saved.modifiedCount === 1) {
      revalidatePath(CALENDAR_PATH);
      return successNoData(done);
    }
  }
  return failure("The sheet is changing right now. Please try again.");
};

/** Take a holder off every slot; returns whether they held one. */
const removeClaim = (sheet: StoredSheet, key: string): boolean => {
  let removed = false;
  for (const slot of sheet.slots) {
    const kept = slot.claims.filter((claim) => claimKey(claim) !== key);
    if (kept.length !== slot.claims.length) removed = true;
    slot.claims = kept;
  }
  return removed;
};

/** Who the viewer signs up as: their team on a team sheet, else themselves. */
const holderFor = async (
  sheet: StoredSheet,
  userId: string
): Promise<{ key: string; team?: ObjectId } | null> => {
  if (sheet.audience !== "project") return { key: userId };
  const team = await Team.findOne(
    { project: sheet.project, members: new ObjectId(userId) },
    { _id: 1 }
  ).lean<{ _id: ObjectId } | null>();
  return team ? { key: String(team._id), team: team._id } : null;
};

/**
 * Take a slot, for yourself or (on a team sheet) for your team. Taking a
 * second one moves you: nobody holds two.
 */
export async function claimSlot(
  sheetId: string,
  startTime: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  const userId = session.user.id;
  try {
    return await changeSlots(
      sheetId,
      session,
      async (sheet) => {
        const holder = await holderFor(sheet, userId);
        if (!holder) {
          return "Only the teams of this group project can take a slot here.";
        }
        const slot = sheet.slots.find((candidate) => candidate.startTime === startTime);
        if (!slot) return "That slot is no longer on the sheet.";
        if (hasStarted(sheet.date, slot.startTime)) return "That slot has already started.";
        if (slot.claims.some((claim) => claimKey(claim) === holder.key)) return null;
        if (slot.claims.length >= sheet.capacity) {
          return "That slot was just taken. Pick another one.";
        }
        removeClaim(sheet, holder.key);
        slot.claims.push({ team: holder.team, user: new ObjectId(userId), at: new Date() });
        return null;
      },
      `Signed up for ${startTime}`
    );
  } catch (error) {
    return handleActionError("claimSlot", error, "Failed to sign up");
  }
}

/** Give your slot (or your team's) back, until it starts. */
export async function releaseSlot(sheetId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  const userId = session.user.id;
  try {
    return await changeSlots(
      sheetId,
      session,
      async (sheet) => {
        const holder = await holderFor(sheet, userId);
        if (!holder) return "You have no slot on this sheet.";
        const held = sheet.slots.find((slot) =>
          slot.claims.some((claim) => claimKey(claim) === holder.key)
        );
        if (!held) return "You have no slot on this sheet.";
        if (hasStarted(sheet.date, held.startTime)) {
          return "Your slot has already started.";
        }
        removeClaim(sheet, holder.key);
        return null;
      },
      "Slot given back"
    );
  } catch (error) {
    return handleActionError("releaseSlot", error, "Failed to give the slot back");
  }
}

/**
 * For whoever runs the sheet: put a team or person on a slot (moving them if
 * they already hold one), or with `startTime: null` take them off the sheet.
 */
export async function assignSlot(
  sheetId: string,
  holderId: string,
  startTime: string | null
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!ObjectId.isValid(holderId)) return failure(ErrorMessages.INVALID_INPUT);
  try {
    return await changeSlots(
      sheetId,
      session,
      async (sheet) => {
        if (!mayManage(sheet, session)) return ErrorMessages.NOT_AUTHORIZED;
        if (startTime === null) {
          return removeClaim(sheet, holderId) ? null : "They hold no slot on this sheet.";
        }
        const slot = sheet.slots.find((candidate) => candidate.startTime === startTime);
        if (!slot) return "That slot is no longer on the sheet.";
        if (slot.claims.some((claim) => claimKey(claim) === holderId)) return null;
        if (slot.claims.length >= sheet.capacity) return "That slot is full.";

        const holder = new ObjectId(holderId);
        if (sheet.audience === "project") {
          const team = await Team.findOne(
            { _id: holder, project: sheet.project },
            { members: 1 }
          ).lean<{ members: ObjectId[] } | null>();
          if (!team) return "That team is not on this group project.";
          removeClaim(sheet, holderId);
          slot.claims.push({
            team: holder,
            user: team.members[0] ?? new ObjectId(session.user.id),
            at: new Date(),
          });
          return null;
        }
        if (!(await User.exists({ _id: holder }))) return ErrorMessages.NOT_FOUND("Person");
        removeClaim(sheet, holderId);
        slot.claims.push({ user: holder, at: new Date() });
        return null;
      },
      startTime ? `Moved to ${startTime}` : "Slot cleared"
    );
  } catch (error) {
    return handleActionError("assignSlot", error, "Failed to change the slot");
  }
}

/** Add one more slot to a sheet, for whoever runs it. */
export async function addSlot(
  sheetId: string,
  startTime: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  try {
    return await changeSlots(
      sheetId,
      session,
      (sheet) => {
        if (!mayManage(sheet, session)) return ErrorMessages.NOT_AUTHORIZED;
        const problem = slotsProblem(
          [...sheet.slots.map((slot) => slot.startTime), startTime],
          sheet.slotMinutes
        );
        if (problem) return problem;
        sheet.slots.push({
          startTime,
          endTime: fromMinutes(toMinutes(startTime) + sheet.slotMinutes),
          claims: [],
        });
        sheet.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
        return null;
      },
      `${startTime} added`
    );
  } catch (error) {
    return handleActionError("addSlot", error, "Failed to add the slot");
  }
}

/** Take an empty slot off a sheet, for whoever runs it. */
export async function removeSlot(
  sheetId: string,
  startTime: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  try {
    return await changeSlots(
      sheetId,
      session,
      (sheet) => {
        if (!mayManage(sheet, session)) return ErrorMessages.NOT_AUTHORIZED;
        const slot = sheet.slots.find((candidate) => candidate.startTime === startTime);
        if (!slot) return "That slot is no longer on the sheet.";
        if (slot.claims.length > 0) return "Clear the slot before removing it.";
        if (sheet.slots.length === 1) return "A sheet needs at least one slot. Delete the sheet instead.";
        sheet.slots = sheet.slots.filter((candidate) => candidate !== slot);
        return null;
      },
      `${startTime} removed`
    );
  } catch (error) {
    return handleActionError("removeSlot", error, "Failed to remove the slot");
  }
}
