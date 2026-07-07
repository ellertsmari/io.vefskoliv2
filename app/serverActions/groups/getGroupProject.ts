"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
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
  TeamFeedbackEntry,
} from "types/groupTypes";
import { applyLifecycle } from "./lifecycle";
import {
  groupEvaluationEntriesByTeam,
  LeanEvaluationRow,
  summarizeTeamEvaluations,
} from "./teamEvalShared";
import {
  isTeacher,
  nextFormationProjectId,
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
    const project = await GroupProject.findById(projectId).lean<GroupProjectLean | null>();
    if (!project) return null;
    await applyLifecycle(project);

    const teacher = isTeacher(session);

    // Later formation projects are hidden from students until it's their turn.
    if (
      !teacher &&
      project.status === "formation" &&
      projectId !== (await nextFormationProjectId())
    ) {
      return null;
    }

    const teams = await Team.find({ project: projectId })
      .populate("members", "name avatarUrl")
      .lean();

    const serializedTeams = teams.map(serializeTeam);
    const userId = session.user.id;

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
      TeamEvaluation.find({
        project: projectId,
        evaluator: userId,
      }).lean<LeanEvaluationRow[]>(),
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

    details.myTeamEvaluations = groupEvaluationEntriesByTeam(myTeamEvals);

    // Feedback received by my team becomes visible once the project is archived.
    if (myTeam && details.project.status === "archived") {
      const feedback = await TeamEvaluation.find({
        project: projectId,
        team: myTeam._id,
      })
        .populate("evaluator", "name")
        .populate("judge", "name")
        .lean();
      details.myTeamFeedback = feedback.map(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (entry: any): TeamFeedbackEntry => ({
          category: entry.category,
          score: entry.score ?? null,
          comment: entry.comment || "",
          evaluatorName:
            entry.evaluator?.name || entry.judge?.name || "Unknown",
        })
      );
    }

    if (teacher) {
      const [students, preferences, teamEvals] = await Promise.all([
        User.find({ role: "user" }, { name: 1, avatarUrl: 1 }).lean(),
        GroupPreference.find({ project: projectId }).lean(),
        TeamEvaluation.find({ project: projectId })
          .populate("evaluator", "role")
          .lean(),
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

      // Panel = teachers + external judges; their scores outweigh students'.
      details.teamEvalSummaries = summarizeTeamEvaluations(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (teamEvals as any[]).map((entry) => ({
          team: entry.team,
          category: entry.category,
          score: entry.score,
          isPanel: !!entry.judge || entry.evaluator?.role === "teacher",
        }))
      );
    }

    return details;
  } catch (error) {
    logError("getGroupProject", error, { projectId });
    return null;
  }
}
