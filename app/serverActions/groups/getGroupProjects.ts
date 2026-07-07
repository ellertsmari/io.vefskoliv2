"use server";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { GroupPreference } from "models/groupPreference";
import { logError } from "utils/errors";
import { GroupProjectListItem } from "types/groupTypes";
import { applyLifecycle } from "./lifecycle";
import { isTeacher, requireSession, serializeProject } from "./helpers";

export async function getGroupProjects(): Promise<GroupProjectListItem[]> {
  const session = await requireSession();
  if (!session) return [];

  try {
    await connectToDatabase();
    let projects = await GroupProject.find({})
      .sort({ startDate: -1 })
      .lean<GroupProjectLean[]>();
    await Promise.all(projects.map((project) => applyLifecycle(project)));

    // Students see running and past projects, but of the upcoming (forming)
    // ones only the next — no wall of future projects.
    if (!isTeacher(session)) {
      const nextFormation = projects
        .filter((project) => project.status === "formation")
        .sort(
          (a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        )[0];
      projects = projects.filter(
        (project) =>
          project.status !== "formation" || project === nextFormation
      );
    }

    const userId = session.user.id;

    return await Promise.all(
      projects.map(async (project) => {
        const [teamCount, myTeam, myPreference] = await Promise.all([
          Team.countDocuments({ project: project._id }),
          Team.findOne(
            { project: project._id, members: userId },
            { name: 1 }
          ).lean<{ _id: unknown; name: string } | null>(),
          GroupPreference.exists({ project: project._id, user: userId }),
        ]);

        return {
          ...serializeProject(project),
          teamCount,
          myTeamId: myTeam ? String(myTeam._id) : null,
          myTeamName: myTeam ? myTeam.name : null,
          hasPreferences: !!myPreference,
        };
      })
    );
  } catch (error) {
    logError("getGroupProjects", error);
    return [];
  }
}
