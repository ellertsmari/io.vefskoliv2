"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { GroupPreference } from "models/groupPreference";
import {
  AMBITION_OPTIONS,
  FOCUS_OPTIONS,
  TECH_STACK_OPTIONS,
} from "constants/groupWork";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { requireSession } from "./helpers";

const SavePreferencesSchema = z.object({
  projectId: z
    .string()
    .refine((value) => ObjectId.isValid(value), { message: "Invalid id" }),
  ambition: z.enum(AMBITION_OPTIONS).or(z.literal("")),
  focus: z.array(z.enum(FOCUS_OPTIONS)).max(FOCUS_OPTIONS.length),
  techStack: z.array(z.enum(TECH_STACK_OPTIONS)).max(TECH_STACK_OPTIONS.length),
  about: z.string().max(2000),
});

export type SavePreferencesData = z.input<typeof SavePreferencesSchema>;

export async function savePreferences(
  data: SavePreferencesData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = SavePreferencesSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { projectId, ...preferences } = validated.data;

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId);
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    if (project.status !== "formation") {
      return failure("Preferences can only be changed while teams are forming");
    }

    await GroupPreference.findOneAndUpdate(
      { project: projectId, user: session.user.id },
      { $set: { ...preferences, updatedAt: new Date() } },
      { upsert: true }
    );
    return successNoData("Preferences saved");
  } catch (error) {
    return handleActionError(
      "savePreferences",
      error,
      ErrorMessages.FAILED_TO_UPDATE("preferences")
    );
  }
}
