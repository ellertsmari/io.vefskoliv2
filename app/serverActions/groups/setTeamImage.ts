"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { Team } from "models/team";
import { GroupProject } from "models/groupProject";
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

/** Only the image fields — never an arbitrary path into the document. */
const TEAM_IMAGE_FIELDS = ["coverImage", "teamPhoto", "logo"] as const;

const SetTeamImageSchema = z.object({
  teamId: objectIdSchema,
  field: z.enum(TEAM_IMAGE_FIELDS),
  /** The uploaded image's URL, or "" to take the image down. */
  value: optionalStoredImageSchema,
});

export type SetTeamImageData = z.input<typeof SetTeamImageSchema>;

/**
 * Put one of a team's showcase images up, or take it down, the moment it is
 * picked — without waiting for "Save team hub".
 *
 * The hub form used to hold new images until it was saved, while removals
 * went through at once. Students uploaded a cover, clicked to another step,
 * and lost it. Saving on pick means what you see in the field is what is
 * stored, and the file behind a replaced image is deleted straight away.
 *
 * Removal keeps working on completed projects, which stay on the public
 * showcase indefinitely: a picture of somebody has to stay removable by the
 * people in it for as long as it is published. Adding a new image is only
 * allowed while the project is running.
 */
export async function setTeamImage(
  data: SetTeamImageData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = SetTeamImageSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { teamId, field, value } = validated.data;

  try {
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team) return failure(ErrorMessages.NOT_FOUND("Team"));

    if (!isTeacher(session)) {
      const isMember = team.members.some(
        (member: ObjectId) => member.toString() === session.user.id
      );
      if (!isMember) return failure(ErrorMessages.NOT_AUTHORIZED);

      if (value !== "") {
        const project = await GroupProject.findById(team.project);
        if (!project || project.status === "archived") {
          return failure(
            "This project is completed and can no longer be edited"
          );
        }
      }
    }

    const previous: string = team[field] || "";
    if (previous === value) return successNoData("Nothing to change");

    team[field] = value;
    await team.save();
    await deleteReplacedImages([previous], [value]);

    return successNoData(value === "" ? "Image removed" : "Image saved");
  } catch (error) {
    return handleActionError(
      "setTeamImage",
      error,
      ErrorMessages.FAILED_TO_UPDATE("team image")
    );
  }
}
