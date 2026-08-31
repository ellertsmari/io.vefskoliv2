"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { PeerEvaluation } from "models/peerEvaluation";
import { PeerEvaluationResult } from "models/peerEvaluationResult";
import { TeamEvaluation } from "models/teamEvaluation";
import { logError } from "utils/errors";
import {
  EvaluationReports,
  PeerEvalStudentReport,
  TeamEvalReport,
} from "types/groupTypes";
import {
  clampGrade,
  peerGradeFactor,
  projectGradeFromScores,
  round1,
  rubricForProject,
} from "constants/groupWork";
import { isTeacher, requireSession, serializeTeam } from "./helpers";
import {
  aggregatePeerEvaluations,
  unbalancedEvaluators,
} from "./peerEvalShared";
import { summarizeTeamEvaluations } from "./teamEvalShared";

export async function getEvaluationReports(
  projectId: string
): Promise<EvaluationReports | null> {
  const session = await requireSession();
  if (!session || !isTeacher(session) || !ObjectId.isValid(projectId)) {
    return null;
  }

  try {
    await connectToDatabase();
    const [project, teams, peerEvals, teamEvals, peerResults] = await Promise.all([
      GroupProject.findById(projectId).lean<GroupProjectLean | null>(),
      Team.find({ project: projectId })
        .populate("members", "name avatarUrl")
        .lean(),
      PeerEvaluation.find({ project: projectId })
        .populate("evaluator", "name")
        .populate("target", "name")
        .lean(),
      TeamEvaluation.find({ project: projectId })
        .populate("evaluator", "name role")
        .populate("judge", "name")
        .lean(),
      PeerEvaluationResult.find({ project: projectId })
        .populate("confirmedBy", "name")
        .lean(),
    ]);

    const serializedTeams = teams.map((team) => serializeTeam(team));

    // Peer evaluation report: one row per assigned student.
    const peerReports = new Map<string, PeerEvalStudentReport>();
    for (const team of serializedTeams) {
      for (const member of team.members) {
        peerReports.set(member._id, {
          userId: member._id,
          name: member.name,
          teamId: team._id,
          teamName: team.name,
          contributionAvg: null,
          teambuildingAvg: null,
          combinedAvg: null,
          receivedCount: 0,
          givenCount: 0,
          givenUnbalanced: false,
          received: [],
          result: null,
          grade: null,
        });
      }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const peerRows = (peerEvals as any[]).map((evaluation) => ({
      evaluatorId: evaluation.evaluator?._id?.toString() ?? "",
      targetId: evaluation.target?._id?.toString() ?? "",
      contributionScore: evaluation.contributionScore,
      teambuildingScore: evaluation.teambuildingScore,
    }));
    const aggregates = aggregatePeerEvaluations(peerRows);
    // Evaluations stored before the balance rule existed. They are left alone
    // and flagged, never rewritten.
    const unbalanced = unbalancedEvaluators(peerRows);
    const resultByStudent = new Map(
      (peerResults as any[]).map((result) => [
        result.student.toString(),
        result,
      ])
    );

    for (const evaluation of peerEvals as any[]) {
      const targetId = evaluation.target?._id?.toString();
      const evaluatorId = evaluation.evaluator?._id?.toString();
      const targetReport = targetId ? peerReports.get(targetId) : undefined;

      // Self-evaluations are counted with the rest: the form asks the whole
      // team, the student included, how the group work went, and the averages
      // are advice for the teacher rather than a computed grade. The entry is
      // only flagged so the teacher can see who wrote what.
      if (targetReport) {
        targetReport.receivedCount += 1;
        targetReport.received.push({
          evaluatorName: evaluation.evaluator?.name || "Unknown",
          contributionScore: evaluation.contributionScore,
          contributionComment: evaluation.contributionComment,
          teambuildingScore: evaluation.teambuildingScore,
          teambuildingComment: evaluation.teambuildingComment,
          isSelf: !!targetId && targetId === evaluatorId,
          evaluatorUnbalanced: !!evaluatorId && unbalanced.has(evaluatorId),
        });
      }
      const evaluatorReport = evaluatorId
        ? peerReports.get(evaluatorId)
        : undefined;
      if (evaluatorReport) evaluatorReport.givenCount += 1;
    }
    for (const report of peerReports.values()) {
      const aggregate = aggregates.get(report.userId);
      if (aggregate) {
        report.contributionAvg = aggregate.contributionAvg;
        report.teambuildingAvg = aggregate.teambuildingAvg;
        report.combinedAvg = aggregate.combinedAvg;
      }
      report.givenUnbalanced = unbalanced.has(report.userId);

      const stored = resultByStudent.get(report.userId);
      if (stored) {
        report.result = {
          contribution: stored.contribution,
          teambuilding: stored.teambuilding,
          note: stored.note || "",
          confirmedByName: stored.confirmedBy?.name || "Unknown",
          confirmedAt: new Date(stored.confirmedAt).toISOString(),
          basedOnContribution: stored.basedOnContribution ?? null,
          basedOnTeambuilding: stored.basedOnTeambuilding ?? null,
          basedOnCount: stored.basedOnCount ?? null,
        };
      }
    }

    // Team evaluation report: per team, weighted category averages (panel =
    // teachers + judges) plus every individual entry.
    const teamReports = new Map<string, TeamEvalReport>(
      serializedTeams.map((team) => [
        team._id,
        { teamId: team._id, teamName: team.name, categories: {}, entries: [] },
      ])
    );
    const summaries = summarizeTeamEvaluations(
      (teamEvals as any[]).map((evaluation) => ({
        team: evaluation.team,
        category: evaluation.category,
        score: evaluation.score,
        isPanel:
          !!evaluation.judge || evaluation.evaluator?.role === "teacher",
      }))
    );
    for (const [teamId, categories] of Object.entries(summaries)) {
      const report = teamReports.get(teamId);
      if (report) report.categories = categories;
    }

    // What each confirmed student's grade comes to. Teachers see it before
    // release — this is exactly what pressing the button would publish.
    for (const report of peerReports.values()) {
      const confirmed = report.result;
      if (!confirmed) continue;
      const teamScores = summaries[report.teamId];
      const projectGrade = projectGradeFromScores(project?.rubric, teamScores);
      if (projectGrade === null) continue;

      const factor = peerGradeFactor(
        confirmed.contribution,
        confirmed.teambuilding
      );
      const categories: Record<string, number> = {};
      for (const item of rubricForProject(project?.rubric)) {
        const avg = teamScores?.[item.key]?.avg;
        if (typeof avg === "number") {
          categories[item.key] = round1(avg * factor);
        }
      }
      report.grade = {
        projectGrade: round1(projectGrade),
        factor: Math.round(factor * 1000) / 1000,
        grade: clampGrade(projectGrade * factor),
        categories,
      };
    }
    for (const evaluation of teamEvals as any[]) {
      const report = teamReports.get(evaluation.team.toString());
      if (!report) continue;
      report.entries.push({
        category: evaluation.category,
        score: evaluation.score ?? null,
        comment: evaluation.comment || "",
        evaluatorName:
          evaluation.evaluator?.name || evaluation.judge?.name || "Unknown",
        evaluatorIsTeacher: evaluation.evaluator?.role === "teacher",
        evaluatorIsJudge: !!evaluation.judge,
      });
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    return {
      peerEvals: Array.from(peerReports.values()).sort((a, b) =>
        a.teamName === b.teamName
          ? a.name.localeCompare(b.name)
          : a.teamName.localeCompare(b.teamName)
      ),
      teamEvals: Array.from(teamReports.values()),
    };
  } catch (error) {
    logError("getEvaluationReports", error, { projectId });
    return null;
  }
}
