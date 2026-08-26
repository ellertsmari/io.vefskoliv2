"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import { optionalStoredImageSchema } from "utils/imageUpload";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";
import { deleteReplacedImages } from "../blobCleanup";

const optionalUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => value === "" || /^https?:\/\//.test(value), {
    message: "Must be a link starting with http(s)://",
  });


const UpdateTeamHubSchema = z.object({
  teamId: objectIdSchema,
  name: z.string().trim().min(1, { message: "Team name is required" }).max(100),
  projectName: z.string().trim().max(200),
  tagline: z.string().trim().max(140),
  projectDescription: z.string().max(20000),
  links: z.object({
    github: optionalUrl,
    figma: optionalUrl,
    figjam: optionalUrl,
    website: optionalUrl,
    backend: optionalUrl,
  }),
  coverImage: optionalStoredImageSchema,
  teamPhoto: optionalStoredImageSchema,
  logo: optionalStoredImageSchema,
});

export type UpdateTeamHubData = z.input<typeof UpdateTeamHubSchema>;

export async function updateTeamHub(
  data: UpdateTeamHubData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = UpdateTeamHubSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { teamId, ...updates } = validated.data;

  try {
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team) return failure(ErrorMessages.NOT_FOUND("Team"));

    if (!isTeacher(session)) {
      const isMember = team.members.some(
        (member: ObjectId) => member.toString() === session.user.id
      );
      if (!isMember) return failure(ErrorMessages.NOT_AUTHORIZED);

      const project = await GroupProject.findById(team.project);
      if (!project || project.status === "archived") {
        return failure("This project is archived and can no longer be edited");
      }
    }

    const previousImages = [team.coverImage, team.teamPhoto, team.logo];

    team.set(updates);
    await team.save();

    // Whatever the save just superseded is now unreachable — drop it from the
    // store rather than paying to keep every version a team ever uploaded.
    await deleteReplacedImages(previousImages, [
      updates.coverImage,
      updates.teamPhoto,
      updates.logo,
    ]);

    return successNoData("Team hub saved");
  } catch (error) {
    return handleActionError(
      "updateTeamHub",
      error,
      ErrorMessages.FAILED_TO_UPDATE("team hub")
    );
  }
}
