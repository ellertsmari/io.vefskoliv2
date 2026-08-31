"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { GroupPreference } from "models/groupPreference";
import { PeerEvaluation } from "models/peerEvaluation";
import { PeerEvaluationResult } from "models/peerEvaluationResult";
import { TeamEvaluation } from "models/teamEvaluation";
import { User } from "models/user";
import { logError } from "utils/errors";
import {
  BoardStudent,
  GroupProjectDetails,
  PeerEvaluationEntry,
  StudentFeedbackEntry,
} from "types/groupTypes";
import {
  clampGrade,
  peerGradeFactor,
  projectGradeFromScores,
  round1,
  rubricForProject,
} from "constants/groupWork";
import { applyLifecycle } from "./lifecycle";
import {
  groupEvaluationEntriesByTeam,
  LeanEvaluationRow,
  summarizeTeamEvaluations,
} from "./teamEvalShared";
import {
  canReadDescription,
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

    const userId = session.user.id;
    // The viewer id resolves "my" showcase consent — each member sees and
    // changes only their own answer.
    const serializedTeams = teams.map((team) => serializeTeam(team, userId));

    const myTeam = serializedTeams.find((team) =>
      team.members.some((member) => member._id === userId)
    );

    // Own preferences + own submitted evaluations (any role, but relevant to students)
    const [myPreference, myPeerEvals, myTeamEvals] = await Promise.all([
      GroupPreference.findOne({ project: projectId, user: userId }).lean(),
      PeerEvaluation.find({ project: projectId, evaluator: userId }).lean(),
      TeamEvaluation.find({
        project: projectId,
        evaluator: userId,
      }).lean<LeanEvaluationRow[]>(),
    ]);

    const details: GroupProjectDetails = {
      project: serializeProject(project, {
        // The brief is withheld until the student has filled in the form.
        hideDescription: !canReadDescription(
          project.status,
          teacher,
          myPreference
        ),
      }),
      teams: serializedTeams,
      myTeamId: myTeam?._id ?? null,
      myPreferences: null,
      myPeerEvaluations: [],
      myTeamEvaluations: {},
      myTeamFeedback: [],
      myFeedbackUnlock: {
        unlocked: false,
        teamsToScore: 0,
        peerEvalPending: false,
      },
      myGrade: null,
      myShowcaseQuotes: [],
      students: null,
      teamEvalSummaries: null,
      rubricLocked: false,
    };

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

    // Feedback is the reward for handing in. A student sees what their team was
    // told once they have submitted everything that is open to them — which is
    // why the class is not held up by whoever is late. A completed project
    // opens it to everybody, so nothing a student can see today is taken away.
    if (myTeam) {
      const otherTeams = serializedTeams.filter(
        (team) => team._id !== myTeam._id
      );
      const teamEvalRequired =
        details.project.teamEvalOpen && otherTeams.length > 0;
      const peerEvalRequired = details.project.peerEvalOpen;
      const teamsToScore = teamEvalRequired
        ? otherTeams.filter(
            (team) => (details.myTeamEvaluations[team._id]?.length ?? 0) === 0
          ).length
        : 0;
      const peerEvalPending = peerEvalRequired && myPeerEvals.length === 0;
      // Something has to have been asked of them before "they have done
      // everything asked of them" means anything.
      const handedIn =
        (teamEvalRequired || peerEvalRequired) &&
        teamsToScore === 0 &&
        !peerEvalPending;
      const unlocked =
        details.project.status === "archived" || handedIn;

      details.myFeedbackUnlock = { unlocked, teamsToScore, peerEvalPending };

      if (unlocked) {
        const feedback = await TeamEvaluation.find({
          project: projectId,
          team: myTeam._id,
        })
          .populate("evaluator", "name role")
          .populate("judge", "name")
          .lean();

        /* eslint-disable @typescript-eslint/no-explicit-any */
        details.myTeamFeedback = (feedback as any[])
          // With no scores on show, a score-only row has nothing to say.
          .filter((entry) => (entry.comment || "").trim().length > 0)
          .map((entry): StudentFeedbackEntry => {
            const kind = entry.judge
              ? "judge"
              : entry.evaluator?.role === "teacher"
                ? "teacher"
                : "student";
            return {
              _id: String(entry._id),
              category: entry.category,
              comment: entry.comment || "",
              evaluatorKind: kind,
              // A classmate's name never reaches another student — not hidden
              // in the UI, absent from the payload.
              evaluatorName:
                kind === "student"
                  ? null
                  : entry.evaluator?.name || entry.judge?.name || "Unknown",
            };
          });

        // The scores themselves wait for the teachers, and what arrives is the
        // student's own grade — never the team's. The team average is computed
        // here to derive that grade and then stays on the server: a group
        // grade is not a student's to see, and `grade = projectGrade × factor`
        // means sending either input would hand them the other by division.
        if (details.project.gradesReleased) {
          const summaries = summarizeTeamEvaluations(
            (feedback as any[]).map((entry) => ({
              team: entry.team,
              category: entry.category,
              score: entry.score,
              isPanel: !!entry.judge || entry.evaluator?.role === "teacher",
            }))
          );
          const teamScores = summaries[myTeam._id] ?? {};

          // Only where a teacher has confirmed what the peer evaluation came
          // to for them. No confirmed figures, no grade — and no fallback to
          // the team's numbers either.
          const confirmed = await PeerEvaluationResult.findOne({
            project: projectId,
            student: userId,
          }).lean<{ contribution: number; teambuilding: number } | null>();
          const projectGrade = projectGradeFromScores(
            project.rubric,
            teamScores
          );
          if (confirmed && projectGrade !== null) {
            const factor = peerGradeFactor(
              confirmed.contribution,
              confirmed.teambuilding
            );
            const categories: Record<string, number> = {};
            for (const item of rubricForProject(project.rubric)) {
              const avg = teamScores[item.key]?.avg;
              if (typeof avg === "number") {
                categories[item.key] = round1(avg * factor);
              }
            }
            details.myGrade = {
              grade: clampGrade(projectGrade * factor),
              categories,
            };
          }
        }
        /* eslint-enable @typescript-eslint/no-explicit-any */
      }

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const myTeamDoc = teams.find(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (team: any) => String(team._id) === myTeam._id
      ) as any;
      details.myShowcaseQuotes = (myTeamDoc?.showcaseQuotes || []).map(
        (id: unknown) => String(id)
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

      // Rubric rows can only be reworded once scores point at their keys.
      details.rubricLocked = teamEvals.length > 0;

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
