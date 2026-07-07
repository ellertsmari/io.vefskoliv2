import { ObjectId } from "mongodb";
import { z } from "zod";
import { Session } from "next-auth";
import { auth } from "../../../auth";
import { GroupProject } from "models/groupProject";
import { TEAM_LINK_KEYS } from "constants/groupWork";
import {
  SerializedGroupProject,
  SerializedPreference,
  SerializedTeam,
  TeamLinks,
} from "types/groupTypes";

// Not server actions themselves — shared helpers for the groups actions.

export const objectIdSchema = z
  .string()
  .refine((value) => ObjectId.isValid(value), { message: "Invalid id" });

export async function requireSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export function isTeacher(session: Session): boolean {
  return session.user.role === "teacher";
}

/**
 * Students only interact with one upcoming project at a time: the forming
 * project with the earliest start date. Later formation projects stay hidden
 * from them until it is their turn.
 */
export async function nextFormationProjectId(): Promise<string | null> {
  const next = await GroupProject.findOne({ status: "formation" }, { _id: 1 })
    .sort({ startDate: 1 })
    .lean<{ _id: unknown } | null>();
  return next ? String(next._id) : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- lean() docs are untyped here */
export function serializeProject(project: any): SerializedGroupProject {
  return {
    _id: project._id.toString(),
    title: project.title,
    description: project.description || "",
    module: project.module ?? null,
    startDate: new Date(project.startDate).toISOString(),
    endDate: new Date(project.endDate).toISOString(),
    status: project.status,
    presentationDate: project.presentationDate
      ? new Date(project.presentationDate).toISOString()
      : null,
    presentationLength: project.presentationLength ?? null,
    presentationSlots: (project.presentationSlots || []).map((slot: any) => ({
      team: slot.team.toString(),
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
    rubric: (project.rubric || []).map((item: any) => ({
      key: item.key,
      title: item.title,
      description: item.description || "",
      discipline: item.discipline || "general",
    })),
    peerEvalOpen: !!project.peerEvalOpen,
    teamEvalOpen: !!project.teamEvalOpen,
  };
}

export function serializeTeam(team: any): SerializedTeam {
  const links = {} as TeamLinks;
  for (const key of TEAM_LINK_KEYS) {
    links[key] = team.links?.[key] || "";
  }
  return {
    _id: team._id.toString(),
    project: team.project.toString(),
    name: team.name,
    members: (team.members || []).map((member: any) =>
      typeof member === "object" && member?.name
        ? {
            _id: member._id.toString(),
            name: member.name,
            avatarUrl: member.avatarUrl || undefined,
          }
        : { _id: member.toString(), name: "" }
    ),
    projectName: team.projectName || "",
    tagline: team.tagline || "",
    projectDescription: team.projectDescription || "",
    links,
    coverImage: team.coverImage || "",
    teamPhoto: team.teamPhoto || "",
    logo: team.logo || "",
  };
}

export function serializePreference(pref: any): SerializedPreference {
  return {
    user: pref.user.toString(),
    ambition: pref.ambition || "",
    focus: pref.focus || [],
    techStack: pref.techStack || [],
    about: pref.about || "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
