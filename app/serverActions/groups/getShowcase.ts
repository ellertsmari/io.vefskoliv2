"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { logError } from "utils/errors";
import {
  ShowcaseProject,
  ShowcaseTeam,
  ShowcaseTeamDetail,
} from "types/groupTypes";
import { serializeTeam } from "./helpers";

// The public showcase: no session required. Students link these pages from
// portfolios and CVs, so only presentable content is exposed — running or
// finished projects, teams that have named their project, and never any
// grades or evaluations.

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const toShowcaseTeam = (team: any): ShowcaseTeam => {
  const serialized = serializeTeam(team);
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
    memberNames: serialized.members
      .map((member) => member.name)
      .filter(Boolean),
  };
};

export async function getShowcase(): Promise<ShowcaseProject[]> {
  try {
    await connectToDatabase();
    const projects = await GroupProject.find({
      status: { $in: ["active", "archived"] },
    })
      .sort({ startDate: -1 })
      .lean<GroupProjectLean[]>();

    const teams = await Team.find({
      project: { $in: projects.map((project) => project._id) },
    })
      .populate("members", "name")
      .lean();

    return projects
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
          .map(toShowcaseTeam),
      }))
      .filter((project) => project.teams.length > 0);
  } catch (error) {
    logError("getShowcase", error);
    return [];
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
