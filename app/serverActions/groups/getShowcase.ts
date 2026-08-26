"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { logError } from "utils/errors";
import {
  ShowcaseCard,
  ShowcaseIndex,
  ShowcaseTeam,
  ShowcaseTeamDetail,
} from "types/groupTypes";
import { serializeTeam, teamShowcaseConsent } from "./helpers";

// The public showcase: no session required. Students link these pages from
// portfolios and CVs, so only presentable content is exposed — running or
// finished projects, teams that have named their project, and never any
// grades or evaluations.
//
// Because there is no session, member names appear only for members who opted
// in — see `showcaseConsents` on the Team model. The team photo carries its own
// consent: teams are told to photograph only the people who want to be in it,
// and any member can take it down at any time via removeTeamImage.

const yearOf = (date: Date | string) => new Date(date).getUTCFullYear();

/**
 * The card grid needs neither the team photo nor the long description, and the
 * grid is the page that grows by a cohort every year — so they are never read
 * out of Mongo in the first place. The detail page reads the full document.
 */
const CARD_FIELDS = {
  name: 1,
  project: 1,
  projectName: 1,
  tagline: 1,
  coverImage: 1,
  logo: 1,
  members: 1,
  showcaseConsents: 1,
} as const;

/** Only the members who opted in to having their name shown publicly. */
const publicMemberNames = (
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
  team: any,
  consent: ReturnType<typeof teamShowcaseConsent>
): string[] =>
  (team.members || [])
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
    .filter((member: any) => member?._id && consent.nameAllowed(String(member._id)))
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
    .map((member: any) => member.name)
    .filter(Boolean);

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
const toShowcaseCard = (team: any): ShowcaseCard => {
  const consent = teamShowcaseConsent(team);
  return {
    _id: String(team._id),
    name: team.name,
    projectName: team.projectName || "",
    tagline: team.tagline || "",
    coverImage: team.coverImage || "",
    logo: team.logo || "",
    memberNames: publicMemberNames(team, consent),
  };
};

/* eslint-disable-next-line @typescript-eslint/no-explicit-any -- lean() docs are untyped */
const toShowcaseTeam = (team: any): ShowcaseTeam => {
  const serialized = serializeTeam(team);
  const consent = teamShowcaseConsent(team);
  return {
    _id: serialized._id,
    name: serialized.name,
    projectName: serialized.projectName,
    tagline: serialized.tagline,
    projectDescription: serialized.projectDescription,
    links: serialized.links,
    coverImage: serialized.coverImage,
    teamPhoto: serialized.teamPhoto,
    logo: serialized.logo,
    memberNames: publicMemberNames(team, consent),
  };
};

/**
 * One year of the showcase at a time, newest by default.
 *
 * Projects are cheap to list in full (no images live on them), so every year
 * with something to show is offered as a filter; only the chosen year's teams
 * are actually loaded.
 */
export async function getShowcase(year?: number): Promise<ShowcaseIndex> {
  const empty: ShowcaseIndex = { projects: [], years: [], year: null };
  try {
    await connectToDatabase();
    const allProjects = await GroupProject.find(
      { status: { $in: ["active", "archived"] } },
      { title: 1, module: 1, startDate: 1, endDate: 1 }
    )
      .sort({ startDate: -1 })
      .lean<GroupProjectLean[]>();

    if (allProjects.length === 0) return empty;

    const years = [
      ...new Set(allProjects.map((project) => yearOf(project.endDate))),
    ].sort((a, b) => b - a);

    // An unknown ?year= falls back to the newest rather than showing nothing.
    const selected = year && years.includes(year) ? year : years[0];
    const projects = allProjects.filter(
      (project) => yearOf(project.endDate) === selected
    );

    const teams = await Team.find(
      { project: { $in: projects.map((project) => project._id) } },
      CARD_FIELDS
    )
      .populate("members", "name")
      .lean();

    return {
      years,
      year: selected,
      projects: projects
        .map((project) => ({
          _id: String(project._id),
          title: project.title,
          module: project.module ?? null,
          startDate: new Date(project.startDate).toISOString(),
          endDate: new Date(project.endDate).toISOString(),
          teams: teams
            .filter(
              (team) =>
                String(team.project) === String(project._id) && team.projectName
            )
            .map(toShowcaseCard),
        }))
        .filter((project) => project.teams.length > 0),
    };
  } catch (error) {
    logError("getShowcase", error);
    return empty;
  }
}

export async function getShowcaseTeam(
  teamId: string
): Promise<ShowcaseTeamDetail | null> {
  if (!ObjectId.isValid(teamId)) return null;

  try {
    await connectToDatabase();
    const team = await Team.findById(teamId)
      .populate("members", "name")
      .lean<{ projectName?: string; project: ObjectId } | null>();
    if (!team || !team.projectName) return null;

    const project = await GroupProject.findById(
      team.project
    ).lean<GroupProjectLean | null>();
    // Forming projects are internal — nothing to show off yet.
    if (!project || project.status === "formation") return null;

    return {
      team: toShowcaseTeam(team),
      project: {
        title: project.title,
        module: project.module ?? null,
        endDate: new Date(project.endDate).toISOString(),
      },
    };
  } catch (error) {
    logError("getShowcaseTeam", error, { teamId });
    return null;
  }
}
