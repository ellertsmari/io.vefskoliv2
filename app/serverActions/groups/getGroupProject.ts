"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import { GroupPreference } from "models/groupPreference";
import { PeerEvaluation } from "models/peerEvaluation";
import { TeamEvaluation } from "models/teamEvaluation";
import { User } from "models/user";
import { logError } from "utils/errors";
import {
  BoardStudent,
  GroupProjectDetails,
  PeerEvaluationEntry,
  TeamEvalSummary,
  TeamEvaluationEntry,
  TeamFeedbackEntry,
} from "types/groupTypes";
import {
  isTeacher,
  requireSession,
  serializePreference,
  serializeProject,
  serializeTeam,
} from "./helpers";

export async function getGroupProject(
  projectId: string
): Promise<GroupProjectDetails | null> {
  const session = await requireSession();
  if (!session || !ObjectId.isValid(projectId)) return null;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId).lean();
    if (!project) return null;

    const teams = await Team.find({ project: projectId })
      .populate("members", "name avatarUrl")
      .lean();

    const serializedTeams = teams.map(serializeTeam);
    const userId = session.user.id;
    const teacher = isTeacher(session);

    const myTeam = serializedTeams.find((team) =>
      team.members.some((member) => member._id === userId)
    );

    const details: GroupProjectDetails = {
      project: serializeProject(project),
      teams: serializedTeams,
      myTeamId: myTeam?._id ?? null,
      myPreferences: null,
      myPeerEvaluations: [],
      myTeamEvaluations: {},
      myTeamFeedback: [],
      students: null,
      teamEvalSummaries: null,
    };

    // Own preferences + own submitted evaluations (any role, but relevant to students)
    const [myPreference, myPeerEvals, myTeamEvals] = await Promise.all([
      GroupPreference.findOne({ project: projectId, user: userId }).lean(),
      PeerEvaluation.find({ project: projectId, evaluator: userId }).lean(),
      TeamEvaluation.find({ project: projectId, evaluator: userId }).lean(),
    ]);

    if (myPreference) details.myPreferences = serializePreference(myPreference);

    details.myPeerEvaluations = myPeerEvals.map(
      (entry): PeerEvaluationEntry => ({
        target: entry.target.toString(),
        contributionScore: entry.contributionScore,
        contributionComment: entry.contributionComment,
        teambuildingScore: entry.teambuildingScore,
        teambuildingComment: entry.teambuildingComment,
      })
    );

    for (const entry of myTeamEvals) {
      const teamId = entry.team.toString();
      const list: TeamEvaluationEntry[] = details.myTeamEvaluations[teamId] || [];
      list.push({
        category: entry.category,
        score: entry.score,
        comment: entry.comment || "",
      });
      details.myTeamEvaluations[teamId] = list;
    }

    // Feedback received by my team becomes visible once the project is archived.
    if (myTeam && details.project.status === "archived") {
      const feedback = await TeamEvaluation.find({
        project: projectId,
        team: myTeam._id,
      })
        .populate("evaluator", "name")
        .lean();
      details.myTeamFeedback = feedback.map(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (entry: any): TeamFeedbackEntry => ({
          category: entry.category,
          score: entry.score,
          comment: entry.comment || "",
          evaluatorName: entry.evaluator?.name || "Unknown",
        })
      );
    }

    if (teacher) {
      const [students, preferences, teamEvals] = await Promise.all([
        User.find({ role: "user" }, { name: 1, avatarUrl: 1 }).lean(),
        GroupPreference.find({ project: projectId }).lean(),
        TeamEvaluation.find({ project: projectId }).lean(),
      ]);

      const prefByUser = new Map(
        preferences.map((pref) => [pref.user.toString(), pref])
      );
      const teamByMember = new Map<string, string>();
      for (const team of serializedTeams) {
        for (const member of team.members) {
          teamByMember.set(member._id, team._id);
        }
      }

      details.students = students.map((student): BoardStudent => {
        const id = String(student._id);
        const pref = prefByUser.get(id);
        return {
          _id: id,
          name: student.name,
          avatarUrl: student.avatarUrl || undefined,
          teamId: teamByMember.get(id) ?? null,
          preferences: pref ? serializePreference(pref) : null,
        };
      });

      const summaries: Record<string, TeamEvalSummary> = {};
      for (const entry of teamEvals) {
        const teamId = entry.team.toString();
        const summary = summaries[teamId] || {};
        const bucket = summary[entry.category] || { avg: 0, count: 0 };
        // store running sum in avg, finalize below
        bucket.avg += entry.score;
        bucket.count += 1;
        summary[entry.category] = bucket;
        summaries[teamId] = summary;
      }
      for (const summary of Object.values(summaries)) {
        for (const bucket of Object.values(summary)) {
          bucket.avg = Math.round((bucket.avg / bucket.count) * 10) / 10;
        }
      }
      details.teamEvalSummaries = summaries;
    }

    return details;
  } catch (error) {
    logError("getGroupProject", error, { projectId });
    return null;
  }
}
