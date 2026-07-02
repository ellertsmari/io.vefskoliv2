"use server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../mongoose-connector";
import { Team } from "models/team";
import { PeerEvaluation } from "models/peerEvaluation";
import { TeamEvaluation } from "models/teamEvaluation";
import { logError } from "utils/errors";
import {
  EvaluationReports,
  PeerEvalStudentReport,
  TeamEvalReport,
} from "types/groupTypes";
import { isTeacher, requireSession, serializeTeam } from "./helpers";

const round1 = (value: number) => Math.round(value * 10) / 10;

export async function getEvaluationReports(
  projectId: string
): Promise<EvaluationReports | null> {
  const session = await requireSession();
  if (!session || !isTeacher(session) || !ObjectId.isValid(projectId)) {
    return null;
  }

  try {
    await connectToDatabase();
    const [teams, peerEvals, teamEvals] = await Promise.all([
      Team.find({ project: projectId })
        .populate("members", "name avatarUrl")
        .lean(),
      PeerEvaluation.find({ project: projectId })
        .populate("evaluator", "name")
        .populate("target", "name")
        .lean(),
      TeamEvaluation.find({ project: projectId })
        .populate("evaluator", "name role")
        .lean(),
    ]);

    const serializedTeams = teams.map(serializeTeam);

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
          receivedCount: 0,
          givenCount: 0,
          received: [],
        });
      }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    for (const evaluation of peerEvals as any[]) {
      const targetId = evaluation.target?._id?.toString();
      const evaluatorId = evaluation.evaluator?._id?.toString();
      const targetReport = targetId ? peerReports.get(targetId) : undefined;
      if (targetReport) {
        targetReport.receivedCount += 1;
        targetReport.received.push({
          evaluatorName: evaluation.evaluator?.name || "Unknown",
          contributionScore: evaluation.contributionScore,
          contributionComment: evaluation.contributionComment,
          teambuildingScore: evaluation.teambuildingScore,
          teambuildingComment: evaluation.teambuildingComment,
        });
      }
      const evaluatorReport = evaluatorId
        ? peerReports.get(evaluatorId)
        : undefined;
      if (evaluatorReport) evaluatorReport.givenCount += 1;
    }
    for (const report of peerReports.values()) {
      if (report.receivedCount > 0) {
        report.contributionAvg = round1(
          report.received.reduce((sum, r) => sum + r.contributionScore, 0) /
            report.receivedCount
        );
        report.teambuildingAvg = round1(
          report.received.reduce((sum, r) => sum + r.teambuildingScore, 0) /
            report.receivedCount
        );
      }
    }

    // Team evaluation report: per team, per category averages + all entries.
    const teamReports = new Map<string, TeamEvalReport>(
      serializedTeams.map((team) => [
        team._id,
        { teamId: team._id, teamName: team.name, categories: {}, entries: [] },
      ])
    );
    for (const evaluation of teamEvals as any[]) {
      const report = teamReports.get(evaluation.team.toString());
      if (!report) continue;
      const bucket = report.categories[evaluation.category] || {
        avg: 0,
        count: 0,
      };
      bucket.avg += evaluation.score;
      bucket.count += 1;
      report.categories[evaluation.category] = bucket;
      report.entries.push({
        category: evaluation.category,
        score: evaluation.score,
        comment: evaluation.comment || "",
        evaluatorName: evaluation.evaluator?.name || "Unknown",
        evaluatorIsTeacher: evaluation.evaluator?.role === "teacher",
      });
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    for (const report of teamReports.values()) {
      for (const bucket of Object.values(report.categories)) {
        bucket.avg = round1(bucket.avg / bucket.count);
      }
    }

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
