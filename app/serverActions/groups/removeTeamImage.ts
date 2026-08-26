"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { Team } from "models/team";
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

const RemoveTeamImageSchema = z.object({
  teamId: objectIdSchema,
  field: z.enum(TEAM_IMAGE_FIELDS),
});

export type RemoveTeamImageData = z.input<typeof RemoveTeamImageSchema>;

/**
 * Take one of a team's showcase images down, and delete the file behind it.
 *
 * This exists separately from updateTeamHub for one reason: it has to work on
 * archived projects. Students lose write access to the hub once a project
 * archives, but archived projects stay on the public showcase indefinitely — so
 * without this, a team photo became permanently unremovable by the very people
 * in it the moment the course ended, and taking it down meant emailing a
 * teacher.
 *
 * That matters most for the team photo. Consent for a photo is given by being
 * in it when it is taken, which only holds up as a safeguard if walking it back
 * is always possible. Any member can remove it, at any time, without asking the
 * others and without giving a reason.
 */
export async function removeTeamImage(
  data: RemoveTeamImageData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = RemoveTeamImageSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { teamId, field } = validated.data;

  try {
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team) return failure(ErrorMessages.NOT_FOUND("Team"));

    if (!isTeacher(session)) {
      const isMember = team.members.some(
        (member: ObjectId) => member.toString() === session.user.id
      );
      if (!isMember) return failure(ErrorMessages.NOT_AUTHORIZED);
    }

    const previous: string = team[field] || "";
    if (!previous) return successNoData("That image is already gone");

    team[field] = "";
    await team.save();
    await deleteReplacedImages([previous], []);

    return successNoData("Image removed");
  } catch (error) {
    return handleActionError(
      "removeTeamImage",
      error,
      ErrorMessages.FAILED_TO_UPDATE("team image")
    );
  }
}
