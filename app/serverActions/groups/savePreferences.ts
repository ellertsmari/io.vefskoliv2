"use server";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { GroupPreference } from "models/groupPreference";
import {
  AMBITION_OPTIONS,
  FOCUS_OPTIONS,
  LOCATION_OPTIONS,
  SCHEDULE_OPTIONS,
  TECH_STACK_OPTIONS,
  techStackOptionsForModule,
} from "constants/groupWork";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { applyLifecycle } from "./lifecycle";
import {
  isPreferenceComplete,
  nextFormationProjectId,
  objectIdSchema,
  requireSession,
} from "./helpers";

const SavePreferencesSchema = z.object({
  projectId: objectIdSchema,
  ambition: z.enum(AMBITION_OPTIONS).or(z.literal("")),
  focus: z.array(z.enum(FOCUS_OPTIONS)).max(FOCUS_OPTIONS.length),
  techStack: z.array(z.enum(TECH_STACK_OPTIONS)).max(TECH_STACK_OPTIONS.length),
  schedule: z.enum(SCHEDULE_OPTIONS).or(z.literal("")),
  location: z.enum(LOCATION_OPTIONS).or(z.literal("")),
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

  // Every question except the free-text one must be answered — an empty save
  // would otherwise unlock the project brief without telling teachers anything.
  if (!isPreferenceComplete(preferences)) {
    return failure(
      "Please answer every question before saving — ambition, focus, tech, when you want to work and where"
    );
  }

  try {
    await connectToDatabase();
    const project = await GroupProject.findById(projectId).lean<GroupProjectLean | null>();
    if (!project) return failure(ErrorMessages.NOT_FOUND("Group project"));
    await applyLifecycle(project);
    if (project.status !== "formation") {
      return failure("Preferences can only be changed while teams are forming");
    }
    // Students answer formation questions one project at a time — only the
    // next upcoming project accepts preferences.
    if (projectId !== (await nextFormationProjectId())) {
      return failure(
        "Preferences open for the next group project only — this one comes later"
      );
    }

    // Only stack choices that make sense for this project's module.
    const allowedTech = new Set(techStackOptionsForModule(project.module));
    for (const tech of preferences.techStack) {
      if (!allowedTech.has(tech)) {
        return failure(`${tech} is not an option for this project`);
      }
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
