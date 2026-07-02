"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import { TeamEvaluation } from "models/teamEvaluation";
import {
  EVALUATION_CATEGORIES,
  EVALUATION_MAX_SCORE,
  EVALUATION_MIN_SCORE,
} from "constants/groupWork";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { isTeacher, requireSession } from "./helpers";

const objectIdSchema = z
  .string()
  .refine((value) => ObjectId.isValid(value), { message: "Invalid id" });

const SubmitTeamEvaluationSchema = z.object({
  projectId: objectIdSchema,
  teamId: objectIdSchema,
  entries: z
    .array(
      z.object({
        category: z.enum(EVALUATION_CATEGORIES),
        score: z
          .number()
          .int()
          .min(EVALUATION_MIN_SCORE)
          .max(EVALUATION_MAX_SCORE),
        comment: z.string().trim().max(5000).default(""),
      })
    )
    .min(1)
    .max(EVALUATION_CATEGORIES.length),
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
  const { projectId, teamId, entries } = validated.data;

  try {
    await connectToDatabase();
    const [project, team] = await Promise.all([
      GroupProject.findById(projectId),
      Team.findById(teamId),
    ]);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    if (!team || team.project.toString() !== projectId) {
      return failure(ErrorMessages.NOT_FOUND("Team"));
    }

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

    await Promise.all(
      entries.map((entry) =>
        TeamEvaluation.findOneAndUpdate(
          {
            project: projectId,
            team: teamId,
            evaluator: session.user.id,
            category: entry.category,
          },
          { $set: { score: entry.score, comment: entry.comment } },
          { upsert: true }
        )
      )
    );
    return successNoData("Evaluation submitted");
  } catch (error) {
    return handleActionError(
      "submitTeamEvaluation",
      error,
      ErrorMessages.FAILED_TO_CREATE("team evaluation")
    );
  }
}
