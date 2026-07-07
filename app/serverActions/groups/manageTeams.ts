"use server";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  success,
  successNoData,
} from "utils/errors";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";

export async function createTeam(data: {
  projectId: string;
  name?: string;
}): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = z
    .object({
      projectId: objectIdSchema,
      name: z.string().trim().min(1).max(100).optional(),
    })
    .safeParse(data);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(validated.data.projectId);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const teamCount = await Team.countDocuments({ project: project._id });
    const team = await Team.create({
      project: project._id,
      name: validated.data.name || `Team ${teamCount + 1}`,
      members: [],
    });
    return success({ id: team._id.toString() });
  } catch (error) {
    return handleActionError(
      "createTeam",
      error,
      ErrorMessages.FAILED_TO_CREATE("team")
    );
  }
}

export async function deleteTeam(data: {
  teamId: string;
}): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = z.object({ teamId: objectIdSchema }).safeParse(data);
  if (!validated.success) return failure(ErrorMessages.INVALID_INPUT);

  try {
    await connectToDatabase();
    const team = await Team.findById(validated.data.teamId);
    if (!team) return failure(ErrorMessages.NOT_FOUND("Team"));
    if (team.members.length > 0) {
      return failure("Move all members out of the team before deleting it");
    }
    await team.deleteOne();
    return successNoData();
  } catch (error) {
    return handleActionError(
      "deleteTeam",
      error,
      ErrorMessages.FAILED_TO_DELETE("team")
    );
  }
}

const SaveAssignmentsSchema = z.object({
  projectId: objectIdSchema,
  changes: z
    .array(
      z.object({
        userId: objectIdSchema,
        teamId: objectIdSchema.nullable(),
      })
    )
    .min(1)
    .max(500),
});

export type SaveAssignmentsData = z.input<typeof SaveAssignmentsSchema>;

export async function saveAssignments(
  data: SaveAssignmentsData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = SaveAssignmentsSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { projectId, changes } = validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));

    const projectTeamIds = new Set(
      (await Team.find({ project: projectId }, { _id: 1 }).lean()).map((team) =>
        String(team._id)
      )
    );
    for (const change of changes) {
      if (change.teamId && !projectTeamIds.has(change.teamId)) {
        return failure("One of the target teams does not belong to this project");
      }
    }

    for (const change of changes) {
      // Remove the student from every team in this project, then add to target.
      await Team.updateMany(
        { project: projectId },
        { $pull: { members: change.userId } }
      );
      if (change.teamId) {
        await Team.updateOne(
          { _id: change.teamId },
          { $addToSet: { members: change.userId } }
        );
      }
    }
    return successNoData();
  } catch (error) {
    return handleActionError(
      "saveAssignments",
      error,
      ErrorMessages.FAILED_TO_UPDATE("team assignments")
    );
  }
}
