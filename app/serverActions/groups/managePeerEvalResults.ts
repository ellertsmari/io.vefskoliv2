"use server";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { PeerEvaluation } from "models/peerEvaluation";
import { PeerEvaluationResult } from "models/peerEvaluationResult";
import { Team } from "models/team";
import {
  PEER_RESULT_MAX,
  PEER_RESULT_MIN,
  round1,
} from "constants/groupWork";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";
import { aggregatePeerEvaluations } from "./peerEvalShared";

// Peer scores are advice. These actions are the teacher reading that advice
// and recording what it comes to for each student — accepting the average the
// team gave, or replacing it with a note saying why.

const resultScore = z
  .number()
  .min(PEER_RESULT_MIN)
  .max(PEER_RESULT_MAX)
  .transform(round1);

const ConfirmSchema = z.object({
  projectId: objectIdSchema,
  studentId: objectIdSchema,
  contribution: resultScore,
  teambuilding: resultScore,
  note: z.string().trim().max(5000).default(""),
});

export type ConfirmPeerEvalResultData = z.input<typeof ConfirmSchema>;

/** Everyone assigned to a team on this project, and what their team said about them. */
async function projectPeerContext(projectId: string) {
  const [teams, peerEvals] = await Promise.all([
    Team.find({ project: projectId }, { members: 1 }).lean(),
    PeerEvaluation.find(
      { project: projectId },
      { target: 1, contributionScore: 1, teambuildingScore: 1 }
    ).lean(),
  ]);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const memberIds = new Set<string>();
  for (const team of teams as any[]) {
    for (const member of team.members || []) {
      memberIds.add(member.toString());
    }
  }
  const aggregates = aggregatePeerEvaluations(
    (peerEvals as any[]).map((evaluation) => ({
      targetId: evaluation.target.toString(),
      contributionScore: evaluation.contributionScore,
      teambuildingScore: evaluation.teambuildingScore,
    }))
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return { memberIds, aggregates };
}

/**
 * Record (or change) the confirmed peer-evaluation result for one student.
 * What the team said at this moment is stored alongside it, so a result
 * confirmed before the last evaluations arrived can be spotted later.
 */
export async function confirmPeerEvalResult(
  data: ConfirmPeerEvalResultData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = ConfirmSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { projectId, studentId, contribution, teambuilding, note } =
    validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId, { _id: 1 }).lean();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const { memberIds, aggregates } = await projectPeerContext(projectId);
    if (!memberIds.has(studentId)) {
      return failure("That student is not on a team in this project");
    }
    const aggregate = aggregates.get(studentId);

    await PeerEvaluationResult.findOneAndUpdate(
      { project: projectId, student: studentId },
      {
        $set: {
          contribution,
          teambuilding,
          note,
          basedOnContribution: aggregate?.contributionAvg ?? null,
          basedOnTeambuilding: aggregate?.teambuildingAvg ?? null,
          basedOnCount: aggregate?.receivedCount ?? 0,
          confirmedBy: session.user.id,
          confirmedAt: new Date(),
        },
      },
      { upsert: true }
    );
    return successNoData("Peer evaluation result saved");
  } catch (error) {
    return handleActionError(
      "confirmPeerEvalResult",
      error,
      ErrorMessages.FAILED_TO_UPDATE("peer evaluation result")
    );
  }
}

const ProjectSchema = z.object({ projectId: objectIdSchema });

/**
 * Accept the team's average for every student who has been evaluated and has
 * no result yet. Confirmed results are left alone — this fills in the
 * uncontroversial rows so the teacher is left with the ones worth thinking
 * about.
 */
export async function confirmAllPeerEvalResults(data: {
  projectId: string;
}): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = ProjectSchema.safeParse(data);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);
  const { projectId } = validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId, { _id: 1 }).lean();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const { memberIds, aggregates } = await projectPeerContext(projectId);
    const existing = await PeerEvaluationResult.find(
      { project: projectId },
      { student: 1 }
    ).lean();
    const confirmed = new Set(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      (existing as any[]).map((result) => result.student.toString())
    );

    const pending = [...aggregates.entries()].filter(
      ([studentId]) => memberIds.has(studentId) && !confirmed.has(studentId)
    );
    if (pending.length === 0) {
      return successNoData("Every evaluated student already has a result");
    }

    await PeerEvaluationResult.insertMany(
      pending.map(([studentId, aggregate]) => ({
        project: projectId,
        student: studentId,
        contribution: aggregate.contributionAvg,
        teambuilding: aggregate.teambuildingAvg,
        note: "",
        basedOnContribution: aggregate.contributionAvg,
        basedOnTeambuilding: aggregate.teambuildingAvg,
        basedOnCount: aggregate.receivedCount,
        confirmedBy: session.user.id,
        confirmedAt: new Date(),
      }))
    );
    return successNoData(
      `Confirmed ${pending.length} result${pending.length === 1 ? "" : "s"}`
    );
  } catch (error) {
    return handleActionError(
      "confirmAllPeerEvalResults",
      error,
      ErrorMessages.FAILED_TO_UPDATE("peer evaluation results")
    );
  }
}

const ClearSchema = z.object({
  projectId: objectIdSchema,
  studentId: objectIdSchema,
});

/** Undo a confirmation, putting the student's row back to pending. */
export async function clearPeerEvalResult(data: {
  projectId: string;
  studentId: string;
}): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = ClearSchema.safeParse(data);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    await PeerEvaluationResult.deleteOne({
      project: validated.data.projectId,
      student: validated.data.studentId,
    });
    return successNoData("Result cleared");
  } catch (error) {
    return handleActionError(
      "clearPeerEvalResult",
      error,
      ErrorMessages.FAILED_TO_DELETE("peer evaluation result")
    );
  }
}
