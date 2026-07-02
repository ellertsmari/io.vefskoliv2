import { Session } from "next-auth";
import { auth } from "../../../auth";
import { TEAM_LINK_KEYS } from "constants/groupWork";
import {
  SerializedGroupProject,
  SerializedPreference,
  SerializedTeam,
  TeamLinks,
} from "types/groupTypes";

// Not server actions themselves — shared helpers for the groups actions.

export async function requireSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export function isTeacher(session: Session): boolean {
  return session.user.role === "teacher";
}

/* eslint-disable @typescript-eslint/no-explicit-any -- lean() docs are untyped here */
export function serializeProject(project: any): SerializedGroupProject {
  return {
    _id: project._id.toString(),
    title: project.title,
    description: project.description || "",
    startDate: new Date(project.startDate).toISOString(),
    endDate: new Date(project.endDate).toISOString(),
    status: project.status,
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
    projectDescription: team.projectDescription || "",
    links,
    images: (team.images || []).filter(Boolean),
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
