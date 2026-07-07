"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { applyLifecycle } from "./lifecycle";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";
import {
  overallCommentSchema,
  teamEvalEntriesSchema,
  upsertTeamEvaluation,
  validateTeamEvalSubmission,
} from "./teamEvalShared";

const SubmitTeamEvaluationSchema = z.object({
  projectId: objectIdSchema,
  teamId: objectIdSchema,
  entries: teamEvalEntriesSchema,
  overallComment: overallCommentSchema,
});

export type SubmitTeamEvaluationData = z.input<
  typeof SubmitTeamEvaluationSchema
>;

export async function submitTeamEvaluation(
  data: SubmitTeamEvaluationData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = SubmitTeamEvaluationSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { projectId, teamId, entries, overallComment } = validated.data;

  try {
    await connectToDatabase();
    const [project, team] = await Promise.all([
      GroupProject.findById(projectId).lean<GroupProjectLean | null>(),
      Team.findById(teamId),
    ]);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    if (!team || team.project.toString() !== projectId) {
      return failure(ErrorMessages.NOT_FOUND("Team"));
    }
    await applyLifecycle(project);

    const validationError = validateTeamEvalSubmission({
      rubric: project.rubric,
      entries,
      overallComment,
    });
    if (validationError) return failure(validationError);

    if (!isTeacher(session)) {
      if (!project.teamEvalOpen) {
        return failure("Team evaluation is not open for this project");
      }
      const isOwnTeam = team.members.some(
        (member: ObjectId) => member.toString() === session.user.id
      );
      if (isOwnTeam) {
        return failure("You cannot evaluate your own team");
      }
    }

    await upsertTeamEvaluation({
      projectId,
      teamId,
      owner: { evaluator: session.user.id },
      entries,
      overallComment,
    });
    return successNoData("Evaluation submitted");
  } catch (error) {
    return handleActionError(
      "submitTeamEvaluation",
      error,
      ErrorMessages.FAILED_TO_CREATE("team evaluation")
    );
  }
}
