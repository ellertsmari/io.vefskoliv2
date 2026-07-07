"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { JudgeInvitation } from "models/judgeInvitation";
import { Team } from "models/team";
import { TeamEvaluation } from "models/teamEvaluation";
import { JudgeView } from "types/groupTypes";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  logError,
  successNoData,
} from "utils/errors";
import { applyLifecycle } from "./lifecycle";
import { objectIdSchema, serializeProject, serializeTeam } from "./helpers";
import {
  groupEvaluationEntriesByTeam,
  LeanEvaluationRow,
  overallCommentSchema,
  teamEvalEntriesSchema,
  upsertTeamEvaluation,
  validateTeamEvalSubmission,
} from "./teamEvalShared";

// Actions for external judges. There is no session — the invitation token in
// the /judge/<token> link is the only credential.

const tokenSchema = z.string().trim().min(10).max(200);

async function findInvitation(token: string) {
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return null;
  return JudgeInvitation.findOne({ token: parsed.data }).lean<{
    _id: ObjectId;
    project: ObjectId;
    name: string;
    focus: "all" | "design" | "code";
  } | null>();
}

export async function getJudgeView(token: string): Promise<JudgeView | null> {
  try {
    await connectToDatabase();
    const invitation = await findInvitation(token);
    if (!invitation) return null;

    const project = await GroupProject.findById(
      invitation.project
    ).lean<GroupProjectLean | null>();
    if (!project) return null;
    await applyLifecycle(project);

    const [teams, myEvals] = await Promise.all([
      Team.find({ project: project._id })
        .populate("members", "name avatarUrl")
        .lean(),
      TeamEvaluation.find({ judge: invitation._id }).lean<LeanEvaluationRow[]>(),
    ]);

    return {
      project: serializeProject(project),
      teams: teams.map(serializeTeam),
      judge: { name: invitation.name, focus: invitation.focus },
      myEvaluations: groupEvaluationEntriesByTeam(myEvals),
    };
  } catch (error) {
    logError("getJudgeView", error);
    return null;
  }
}

const SubmitJudgeEvaluationSchema = z.object({
  token: tokenSchema,
  teamId: objectIdSchema,
  entries: teamEvalEntriesSchema,
  overallComment: overallCommentSchema,
});

export type SubmitJudgeEvaluationData = z.input<
  typeof SubmitJudgeEvaluationSchema
>;

export async function submitJudgeEvaluation(
  data: SubmitJudgeEvaluationData
): Promise<ActionResult<void>> {
  const validated = SubmitJudgeEvaluationSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { token, teamId, entries, overallComment } = validated.data;

  try {
    await connectToDatabase();
    const invitation = await findInvitation(token);
    if (!invitation) return failure(ErrorMessages.NOT_FOUND("Invitation"));

    const [project, team] = await Promise.all([
      GroupProject.findById(invitation.project).lean<GroupProjectLean | null>(),
      Team.findById(teamId),
    ]);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    if (!team || team.project.toString() !== String(invitation.project)) {
      return failure(ErrorMessages.NOT_FOUND("Team"));
    }
    if (project.status === "archived") {
      return failure("This project has been archived");
    }

    const validationError = validateTeamEvalSubmission({
      rubric: project.rubric,
      entries,
      overallComment,
      focus: invitation.focus,
    });
    if (validationError) return failure(validationError);

    await upsertTeamEvaluation({
      projectId: String(invitation.project),
      teamId,
      owner: { judge: String(invitation._id) },
      entries,
      overallComment,
    });
    return successNoData("Evaluation submitted");
  } catch (error) {
    return handleActionError(
      "submitJudgeEvaluation",
      error,
      ErrorMessages.FAILED_TO_CREATE("judge evaluation")
    );
  }
}
