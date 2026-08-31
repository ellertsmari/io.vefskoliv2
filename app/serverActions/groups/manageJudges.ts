"use server";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { JudgeInvitation } from "models/judgeInvitation";
import { TeamEvaluation } from "models/teamEvaluation";
import { JUDGE_FOCUS_OPTIONS, JudgeFocus } from "constants/groupWork";
import { SerializedJudgeInvitation } from "types/groupTypes";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  logError,
  success,
  successNoData,
} from "utils/errors";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";

const CreateJudgeSchema = z.object({
  projectId: objectIdSchema,
  name: z.string().trim().min(1, { message: "Name is required" }).max(200),
  focus: z.enum(JUDGE_FOCUS_OPTIONS),
});

export type CreateJudgeData = z.input<typeof CreateJudgeSchema>;

export async function createJudgeInvitation(
  data: CreateJudgeData
): Promise<ActionResult<{ id: string; token: string }>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = CreateJudgeSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(validated.data.projectId);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const invitation = await JudgeInvitation.create({
      project: project._id,
      name: validated.data.name,
      focus: validated.data.focus,
      token: randomBytes(24).toString("base64url"),
      createdBy: session.user.id,
    });
    return success({
      id: invitation._id.toString(),
      token: invitation.token,
    });
  } catch (error) {
    return handleActionError(
      "createJudgeInvitation",
      error,
      ErrorMessages.FAILED_TO_CREATE("judge invitation")
    );
  }
}

const UpdateJudgeFocusSchema = z.object({
  invitationId: objectIdSchema,
  focus: z.enum(JUDGE_FOCUS_OPTIONS),
});

/**
 * Re-scope a judge after the fact — they often decide at the presentation
 * itself that they would rather judge only the design, or that they are happy
 * to judge everything.
 *
 * Scores they already gave outside the new focus are kept and simply stop
 * counting (see `summarizeTeamEvaluations`), so this is reversible: putting
 * them back on "Everything" brings those scores back into the averages.
 *
 * Teachers only. A judge holds a token, not a session, and must never be able
 * to widen or narrow what their own scores count towards.
 */
export async function updateJudgeFocus(data: {
  invitationId: string;
  focus: JudgeFocus;
}): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = UpdateJudgeFocusSchema.safeParse(data);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    const result = await JudgeInvitation.updateOne(
      { _id: validated.data.invitationId },
      { $set: { focus: validated.data.focus } }
    );
    if (result.matchedCount === 0) {
      return failure(ErrorMessages.NOT_FOUND("Judge invitation"));
    }
    return successNoData("Judge focus updated");
  } catch (error) {
    return handleActionError(
      "updateJudgeFocus",
      error,
      ErrorMessages.FAILED_TO_UPDATE("judge invitation")
    );
  }
}

export async function listJudgeInvitations(
  projectId: string
): Promise<SerializedJudgeInvitation[]> {
  const session = await requireSession();
  if (!session || !isTeacher(session) || !ObjectId.isValid(projectId)) {
    return [];
  }

  try {
    await connectToDatabase();
    const invitations = await JudgeInvitation.find({ project: projectId })
      .sort({ createdAt: 1 })
      .lean();
    const submittedJudges = new Set(
      (
        await TeamEvaluation.distinct("judge", {
          judge: { $in: invitations.map((invitation) => invitation._id) },
        })
      ).map(String)
    );
    return invitations.map((invitation) => ({
      _id: String(invitation._id),
      name: invitation.name,
      focus: invitation.focus,
      token: invitation.token,
      showcaseNameConsent: !!invitation.showcaseNameConsent,
      hasSubmitted: submittedJudges.has(String(invitation._id)),
    }));
  } catch (error) {
    logError("listJudgeInvitations", error, { projectId });
    return [];
  }
}

export async function deleteJudgeInvitation(data: {
  invitationId: string;
}): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = z
    .object({ invitationId: objectIdSchema })
    .safeParse(data);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    const hasEvaluations = await TeamEvaluation.exists({
      judge: validated.data.invitationId,
    });
    if (hasEvaluations) {
      return failure(
        "This judge has already submitted evaluations — their invitation cannot be deleted"
      );
    }
    const deleted = await JudgeInvitation.findByIdAndDelete(
      validated.data.invitationId
    );
    if (!deleted) return failure(ErrorMessages.NOT_FOUND("Judge invitation"));
    return successNoData();
  } catch (error) {
    return handleActionError(
      "deleteJudgeInvitation",
      error,
      ErrorMessages.FAILED_TO_DELETE("judge invitation")
    );
  }
}
