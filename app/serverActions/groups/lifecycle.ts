import { GroupProject } from "models/groupProject";
import { logError } from "utils/errors";

// Date-driven lifecycle for group projects. Nothing here is a server action —
// these helpers are called from the read/write actions so the stored flags
// converge on the schedule without any cron job:
//
//   formation ──(startDate arrives)──▶ active
//   teamEvalOpen  ⟵ true when the presentation day arrives
//   peerEvalOpen  ⟵ true when the last presentation slot has ended
//
// Each transition fires exactly once (tracked in `autoApplied`), so teachers
// can override the result afterwards — close a gate again, revert the status —
// without the next read re-applying it.
//
// Times are interpreted in server time; Iceland runs on UTC year-round so
// "HH:MM" strings on the presentation date map directly onto UTC.

type SlotLike = { startTime?: string; endTime?: string };

type ProjectLike = {
  status: "formation" | "active" | "archived";
  startDate: Date | string;
  presentationDate?: Date | string | null;
  presentationSlots?: SlotLike[];
  peerEvalOpen: boolean;
  teamEvalOpen: boolean;
  autoApplied?: {
    activated?: boolean;
    teamEvalOpened?: boolean;
    peerEvalOpened?: boolean;
  };
};

const startOfDay = (value: Date | string): Date => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value: Date | string): Date => {
  const date = new Date(value);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

/** Combine a date with an "HH:MM" string (UTC). Invalid times return null. */
const atTime = (value: Date | string, time: string): Date | null => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time || "");
  if (!match) return null;
  const date = new Date(value);
  date.setUTCHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
};

/** When the last presentation is over — end of the last slot, or end of the presentation day when no slots are scheduled. */
export function lastPresentationEnd(project: ProjectLike): Date | null {
  if (!project.presentationDate) return null;
  let latest: Date | null = null;
  for (const slot of project.presentationSlots || []) {
    const end = slot.endTime ? atTime(project.presentationDate, slot.endTime) : null;
    if (end && (!latest || end > latest)) latest = end;
  }
  return latest ?? endOfDay(project.presentationDate);
}

export type LifecycleUpdates = Partial<{
  status: "active";
  teamEvalOpen: true;
  peerEvalOpen: true;
}>;

/**
 * The date-driven changes a project is due for at `now`. Only ever turns
 * things on, and each transition fires at most once (`autoApplied` guards),
 * so manual teacher overrides stick. Archived projects are left untouched.
 */
export function dueLifecycleUpdates(
  project: ProjectLike,
  now: Date = new Date()
): LifecycleUpdates {
  const updates: LifecycleUpdates = {};
  if (project.status === "archived") return updates;
  const done = project.autoApplied || {};

  if (
    project.status === "formation" &&
    !done.activated &&
    now >= startOfDay(project.startDate)
  ) {
    updates.status = "active";
  }

  if (project.presentationDate) {
    if (
      !project.teamEvalOpen &&
      !done.teamEvalOpened &&
      now >= startOfDay(project.presentationDate)
    ) {
      updates.teamEvalOpen = true;
    }
    const peerEvalStart = lastPresentationEnd(project);
    if (
      !project.peerEvalOpen &&
      !done.peerEvalOpened &&
      peerEvalStart &&
      now >= peerEvalStart
    ) {
      updates.peerEvalOpen = true;
    }
  }

  return updates;
}

/**
 * Apply due lifecycle updates to a lean project object and persist them,
 * marking each fired transition in `autoApplied` so it never re-fires.
 * Mutates (and returns) the given object so callers can serialize the fresh
 * state without re-reading.
 */
export async function applyLifecycle<
  T extends ProjectLike & { _id: unknown }
>(project: T, now: Date = new Date()): Promise<T> {
  const updates = dueLifecycleUpdates(project, now);
  if (Object.keys(updates).length === 0) return project;

  Object.assign(project, updates);
  const fired = {
    ...(updates.status ? { activated: true } : null),
    ...(updates.teamEvalOpen ? { teamEvalOpened: true } : null),
    ...(updates.peerEvalOpen ? { peerEvalOpened: true } : null),
  };
  project.autoApplied = { ...project.autoApplied, ...fired };

  try {
    const set: Record<string, unknown> = { ...updates };
    for (const key of Object.keys(fired)) set[`autoApplied.${key}`] = true;
    await GroupProject.updateOne({ _id: project._id }, { $set: set });
  } catch (error) {
    logError("applyLifecycle", error, { projectId: String(project._id) });
  }
  return project;
}
