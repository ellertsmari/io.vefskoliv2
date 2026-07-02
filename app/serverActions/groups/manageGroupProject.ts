"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  success,
  successNoData,
} from "utils/errors";
import { isTeacher, requireSession } from "./helpers";

const objectIdSchema = z
  .string()
  .refine((value) => ObjectId.isValid(value), { message: "Invalid id" });

const CreateProjectSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(200),
  description: z.string().max(20000).default(""),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// z.coerce.date() types its input as Date, but the forms send date strings.
export type CreateProjectData = Omit<
  z.input<typeof CreateProjectSchema>,
  "startDate" | "endDate"
> & { startDate: string | Date; endDate: string | Date };

export async function createGroupProject(
  data: CreateProjectData
): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = CreateProjectSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  if (validated.data.endDate < validated.data.startDate) {
    return failure("End date must be after the start date");
  }

  try {
    await connectToDatabase();
    const project = await GroupProject.create({
      ...validated.data,
      status: "formation",
      createdBy: session.user.id,
    });
    return success({ id: project._id.toString() });
  } catch (error) {
    return handleActionError(
      "createGroupProject",
      error,
      ErrorMessages.FAILED_TO_CREATE("group project")
    );
  }
}

const UpdateProjectSchema = z.object({
  projectId: objectIdSchema,
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(20000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["formation", "active", "archived"]).optional(),
  peerEvalOpen: z.boolean().optional(),
  teamEvalOpen: z.boolean().optional(),
});

export type UpdateProjectData = Omit<
  z.input<typeof UpdateProjectSchema>,
  "startDate" | "endDate"
> & { startDate?: string | Date; endDate?: string | Date };

export async function updateGroupProject(
  data: UpdateProjectData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = UpdateProjectSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }

  const { projectId, ...updates } = validated.data;
  const definedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  );
  if (Object.keys(definedUpdates).length === 0) {
    return failure(ErrorMessages.INVALID_INPUT);
  }

  try {
    await connectToDatabase();
    const project = await GroupProject.findByIdAndUpdate(projectId, {
      $set: definedUpdates,
    });
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    return successNoData();
  } catch (error) {
    return handleActionError(
      "updateGroupProject",
      error,
      ErrorMessages.FAILED_TO_UPDATE("group project")
    );
  }
}
