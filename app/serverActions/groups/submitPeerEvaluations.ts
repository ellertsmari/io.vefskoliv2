"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { PeerEvaluation } from "models/peerEvaluation";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { validatePeerEvaluationSubmission } from "constants/groupWork";
import { applyLifecycle } from "./lifecycle";
import { objectIdSchema, requireSession } from "./helpers";

const peerScore = z.number().int().min(-2).max(2);

const SubmitPeerEvaluationsSchema = z.object({
  projectId: objectIdSchema,
  evaluations: z
    .array(
      z.object({
        targetId: objectIdSchema,
        contributionScore: peerScore,
        contributionComment: z
          .string()
          .trim()
          .min(1, { message: "A short justification is required" })
          .max(5000),
        teambuildingScore: peerScore,
        teambuildingComment: z
          .string()
          .trim()
          .min(1, { message: "A short justification is required" })
          .max(5000),
      })
    )
    .min(1)
    .max(50),
});

export type SubmitPeerEvaluationsData = z.input<
  typeof SubmitPeerEvaluationsSchema
>;

export async function submitPeerEvaluations(
  data: SubmitPeerEvaluationsData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = SubmitPeerEvaluationsSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { projectId, evaluations } = validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId).lean<GroupProjectLean | null>();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    await applyLifecycle(project);
    if (!project.peerEvalOpen) {
      return failure("Peer evaluation is not open for this project");
    }

    const myTeam = await Team.findOne({
      project: projectId,
      members: session.user.id,
    });
    if (!myTeam) {
      return failure("You are not assigned to a team in this project");
    }

    // Everyone on the team is a valid target, the evaluator included: the form
    // asks how the group work went and the student is part of the group, so a
    // self-evaluation is just another row on the same two axes. It counts in
    // the averages like any other, because those averages advise the teacher's
    // grade rather than being one.
    //
    // The whole team has to be scored in one submission: the balance rule is
    // meaningless over a subset, and without it an evaluation of nobody but
    // oneself would pass.
    const memberIds = myTeam.members.map((member: ObjectId) =>
      member.toString()
    );
    const ruleError = validatePeerEvaluationSubmission({
      entries: evaluations,
      memberIds,
    });
    if (ruleError) return failure(ruleError);

    await Promise.all(
      evaluations.map((evaluation) =>
        PeerEvaluation.findOneAndUpdate(
          {
            project: projectId,
            evaluator: session.user.id,
            target: evaluation.targetId,
          },
          {
            $set: {
              team: myTeam._id,
              contributionScore: evaluation.contributionScore,
              contributionComment: evaluation.contributionComment,
              teambuildingScore: evaluation.teambuildingScore,
              teambuildingComment: evaluation.teambuildingComment,
            },
          },
          { upsert: true }
        )
      )
    );
    return successNoData("Peer evaluation submitted");
  } catch (error) {
    return handleActionError(
      "submitPeerEvaluations",
      error,
      ErrorMessages.FAILED_TO_CREATE("peer evaluation")
    );
  }
}
