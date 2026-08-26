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
import { objectIdSchema, requireSession } from "./helpers";

const SetShowcaseConsentSchema = z.object({
  teamId: objectIdSchema,
  name: z.boolean(),
});

export type SetShowcaseConsentData = z.input<typeof SetShowcaseConsentSchema>;

/**
 * Record the signed-in member's own answer to "may my name go on the public
 * showcase?".
 *
 * Three deliberate properties:
 *
 * 1. The subject is always `session.user.id` — never a parameter. Nobody,
 *    teachers included, can answer this on someone else's behalf.
 * 2. It works on archived projects. Everywhere else students lose write access
 *    once a project is archived, but archived projects stay on the showcase
 *    indefinitely, so withdrawing has to keep working long after the course
 *    ended — a consent you cannot take back was never really consent.
 * 3. It is individual. A member who declines drops off the public list while
 *    their teammates stay, so nobody's answer — or silence — can block anyone
 *    else. Team photos are handled separately: consent for those is given when
 *    the picture is taken, and undone with removeTeamImage.
 */
export async function setShowcaseConsent(
  data: SetShowcaseConsentData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = SetShowcaseConsentSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { teamId, name } = validated.data;
  const userId = session.user.id;

  try {
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team) return failure(ErrorMessages.NOT_FOUND("Team"));

    const isMember = team.members.some(
      (member: ObjectId) => member.toString() === userId
    );
    if (!isMember) return failure(ErrorMessages.NOT_AUTHORIZED);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- subdocument */
    const existing = (team.showcaseConsents || []).find(
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- subdocument */
      (entry: any) => String(entry.user) === userId
    );
    if (existing) {
      existing.name = name;
      existing.updatedAt = new Date();
    } else {
      team.showcaseConsents.push({
        user: new ObjectId(userId),
        name,
        updatedAt: new Date(),
      });
    }

    await team.save();
    return successNoData("Your showcase choice is saved");
  } catch (error) {
    return handleActionError(
      "setShowcaseConsent",
      error,
      ErrorMessages.FAILED_TO_UPDATE("showcase consent")
    );
  }
}
