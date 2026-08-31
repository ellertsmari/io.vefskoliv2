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

/**
 * Has the student actually answered the formation questions? Every field is
 * optional in the schema (so a half-filled form can still be saved as a draft
 * by a teacher fixing things up), but the description gate and the team
 * composition both need real answers — `about` stays optional, it's free text.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
export function isPreferenceComplete(pref: any): boolean {
  if (!pref) return false;
  return (
    !!pref.ambition &&
    (pref.focus?.length ?? 0) > 0 &&
    (pref.techStack?.length ?? 0) > 0 &&
    !!pref.schedule &&
    !!pref.location
  );
}

/**
 * Students only get the project brief once they've filled in the formation
 * form. The gate applies while teams are forming — after that everyone needs
 * the description to do the work, so it opens for the whole class.
 */
export function canReadDescription(
  status: string,
  teacher: boolean,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
  myPreference: any
): boolean {
  if (teacher) return true;
  if (status !== "formation") return true;
  return isPreferenceComplete(myPreference);
}

/* eslint-disable @typescript-eslint/no-explicit-any -- lean() docs are untyped here */
export function serializeProject(
  project: any,
  { hideDescription = false }: { hideDescription?: boolean } = {}
): SerializedGroupProject {
  return {
    _id: project._id.toString(),
    title: project.title,
    description: hideDescription ? "" : project.description || "",
    descriptionLocked: hideDescription,
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
    gradesReleased: !!project.gradesReleased,
    teamEvalOpen: !!project.teamEvalOpen,
  };
}

/** The id of a team member, whether or not `members` was populated. */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
const memberId = (member: any): string =>
  typeof member === "object" && member?._id
    ? member._id.toString()
    : String(member);

/**
 * Who on this team has agreed to have their name shown on the public showcase.
 *
 * Consent is opt-in, so a member with no stored entry counts as "no". Entries
 * belonging to people who have since left the team are ignored — a departed
 * member's old answer says nothing about who is on the team now.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
export function teamShowcaseConsent(team: any) {
  const members: string[] = (team.members || []).map(memberId);
  const byUser = new Map<string, boolean>();
  for (const entry of team.showcaseConsents || []) {
    byUser.set(String(entry.user), !!entry.name);
  }

  return {
    memberCount: members.length,
    nameAgreed: members.filter((id) => byUser.get(id) === true).length,
    /** Individual — a member who declines drops out, the others stay. */
    nameAllowed: (id: string) => byUser.get(id) === true,
    forViewer: (viewerId?: string) => ({
      myName: viewerId ? byUser.get(viewerId) === true : false,
    }),
  };
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
export function serializeTeam(team: any, viewerId?: string): SerializedTeam {
  const links = {} as TeamLinks;
  for (const key of TEAM_LINK_KEYS) {
    links[key] = team.links?.[key] || "";
  }
  const consent = teamShowcaseConsent(team);
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
    showcaseConsent: {
      ...consent.forViewer(viewerId),
      nameAgreed: consent.nameAgreed,
      memberCount: consent.memberCount,
    },
  };
}

export function serializePreference(pref: any): SerializedPreference {
  return {
    user: pref.user.toString(),
    ambition: pref.ambition || "",
    focus: pref.focus || [],
    techStack: pref.techStack || [],
    schedule: pref.schedule || "",
    location: pref.location || "",
    about: pref.about || "",
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
