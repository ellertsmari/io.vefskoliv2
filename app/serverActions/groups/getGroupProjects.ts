"use server";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { GroupPreference } from "models/groupPreference";
import { PeerEvaluation } from "models/peerEvaluation";
import { TeamEvaluation } from "models/teamEvaluation";
import { logError } from "utils/errors";
import { GroupProjectListItem } from "types/groupTypes";
import { applyLifecycle } from "./lifecycle";
import {
  canReadDescription,
  isPreferenceComplete,
  isTeacher,
  requireSession,
  serializeProject,
} from "./helpers";

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
    const teacher = isTeacher(session);

    return await Promise.all(
      projects.map(async (project) => {
        const [teams, myPreference] = await Promise.all([
          Team.find({ project: project._id }, { name: 1, members: 1 }).lean<
            { _id: unknown; name: string; members: unknown[] }[]
          >(),
          GroupPreference.findOne({
            project: project._id,
            user: userId,
          }).lean(),
        ]);
        const myTeam = teams.find((team) =>
          team.members.some((member) => String(member) === userId)
        );
        const serialized = serializeProject(project, {
          // Cards don't render the description, but it would still ship in
          // the payload — withhold it on the same terms as the detail page.
          hideDescription: !canReadDescription(
            project.status,
            teacher,
            myPreference
          ),
        });

        // What is still owed, so the card (and the dashboard) can lead with
        // the pending action rather than the team name.
        let peerEvalPending = false;
        let teamsToScore = 0;
        if (!teacher && myTeam) {
          if (serialized.peerEvalOpen) {
            const handedIn = await PeerEvaluation.countDocuments({
              project: project._id,
              evaluator: userId,
            });
            peerEvalPending = handedIn === 0;
          }
          if (serialized.teamEvalOpen) {
            const scored = await TeamEvaluation.distinct("team", {
              project: project._id,
              evaluator: userId,
            });
            const scoredIds = new Set(scored.map((id) => String(id)));
            teamsToScore = teams.filter(
              (team) =>
                team !== myTeam && !scoredIds.has(String(team._id))
            ).length;
          }
        }

        return {
          ...serialized,
          teamCount: teams.length,
          myTeamId: myTeam ? String(myTeam._id) : null,
          myTeamName: myTeam ? myTeam.name : null,
          // "Filled in" means every required question is answered — a partial
          // draft still gets the "fill in your preferences" nudge.
          hasPreferences: isPreferenceComplete(myPreference),
          peerEvalPending,
          teamsToScore,
        };
      })
    );
  } catch (error) {
    logError("getGroupProjects", error);
    return [];
  }
}
