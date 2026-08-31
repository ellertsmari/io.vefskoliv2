"use server";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { Team } from "models/team";
import { TeamEvaluation } from "models/teamEvaluation";
import {
  GROUP_PROJECT_MODULES,
  OVERALL_CATEGORY,
  rubricForProject,
} from "constants/groupWork";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  success,
  successNoData,
} from "utils/errors";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";

const moduleSchema = z
  .number()
  .int()
  .refine(
    (value) => (GROUP_PROJECT_MODULES as readonly number[]).includes(value),
    { message: "No group project exists for this module" }
  );

const timeSchema = z
  .string()
  .regex(/^\d{1,2}:\d{2}$/, { message: "Time must be HH:MM" });

const presentationSlotSchema = z.object({
  team: objectIdSchema,
  startTime: timeSchema,
  endTime: timeSchema,
});

const rubricItemSchema = z.object({
  // Stored TeamEvaluation documents point at this key, so it is generated
  // once from the title (rubricKeyFromTitle) and then never edited.
  key: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, {
      message: "Rubric keys may only contain lowercase letters, numbers and dashes",
    }),
  title: z.string().trim().min(1, { message: "Every rubric row needs a title" }).max(200),
  description: z.string().trim().max(1000).default(""),
  discipline: z.enum(["design", "code", "general"]).default("general"),
});

/**
 * Rules that hold no matter what has been evaluated: keys are unique and none
 * of them squats the reserved overall-comment key. Returns a message, or null.
 */
function validateRubricShape(
  rubric: z.output<typeof rubricItemSchema>[]
): string | null {
  const seen = new Set<string>();
  for (const item of rubric) {
    if (item.key === OVERALL_CATEGORY) {
      return `"${OVERALL_CATEGORY}" is reserved for the overall comment and cannot be a rubric row`;
    }
    if (seen.has(item.key)) {
      return `Two rubric rows share the key "${item.key}"`;
    }
    seen.add(item.key);
  }
  return null;
}

const CreateProjectSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(200),
  description: z.string().max(20000).default(""),
  module: moduleSchema.nullable().optional(),
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
  module: moduleSchema.nullable().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["formation", "active", "archived"]).optional(),
  presentationDate: z.coerce.date().nullable().optional(),
  presentationLength: z.number().int().min(5).max(240).nullable().optional(),
  presentationSlots: z.array(presentationSlotSchema).max(100).optional(),
  rubric: z.array(rubricItemSchema).max(50).optional(),
  peerEvalOpen: z.boolean().optional(),
  teamEvalOpen: z.boolean().optional(),
  gradesReleased: z.boolean().optional(),
  panelWeight: z.number().min(0).max(1).optional(),
});

export type UpdateProjectData = Omit<
  z.input<typeof UpdateProjectSchema>,
  "startDate" | "endDate" | "presentationDate"
> & {
  startDate?: string | Date;
  endDate?: string | Date;
  presentationDate?: string | Date | null;
};

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

    if (validated.data.presentationSlots?.length) {
      const projectTeamIds = new Set(
        (await Team.find({ project: projectId }, { _id: 1 }).lean()).map(
          (team) => String(team._id)
        )
      );
      for (const slot of validated.data.presentationSlots) {
        if (!projectTeamIds.has(slot.team)) {
          return failure("One of the slots points to a team outside this project");
        }
      }
    }

    if (validated.data.rubric) {
      const shapeError = validateRubricShape(validated.data.rubric);
      if (shapeError) return failure(shapeError);

      const current = await GroupProject.findById(
        projectId
      ).lean<GroupProjectLean | null>();
      if (!current) return failure(ErrorMessages.NOT_FOUND("Group project"));

      // Scores are stored against rubric keys (TeamEvaluation.category), so
      // the set of keys freezes as soon as anybody has evaluated: renaming a
      // row would orphan its scores and removing one would silently change
      // every team's average. Wording, discipline and row order stay editable.
      // Both sides go through rubricForProject so an empty rubric is compared
      // as the default rows it actually renders as.
      if (await TeamEvaluation.exists({ project: projectId })) {
        const currentKeys = new Set(
          rubricForProject(current.rubric).map((item) => item.key)
        );
        const nextKeys = new Set(
          rubricForProject(validated.data.rubric).map((item) => item.key)
        );
        const added = [...nextKeys].filter((key) => !currentKeys.has(key));
        const removed = [...currentKeys].filter((key) => !nextKeys.has(key));
        if (added.length > 0 || removed.length > 0) {
          const changes = [
            added.length > 0 ? `adding ${added.join(", ")}` : null,
            removed.length > 0 ? `removing ${removed.join(", ")}` : null,
          ]
            .filter(Boolean)
            .join(" and ");
          return failure(
            `This project has already been evaluated, so rubric rows can no longer be added or removed (${changes}). You can still edit their titles, descriptions and disciplines.`
          );
        }
      }
    }

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
