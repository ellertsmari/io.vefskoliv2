"use server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { connectToDatabase } from "../mongoose-connector";
import { Team } from "models/team";
import { TeamEvaluation } from "models/teamEvaluation";
import { MAX_SHOWCASE_QUOTES } from "constants/groupWork";
import {
  ActionResult,
  ErrorMessages,
  failure,
  handleActionError,
  successNoData,
} from "utils/errors";
import { objectIdSchema, isTeacher, requireSession } from "./helpers";

const SetShowcaseQuotesSchema = z.object({
  teamId: objectIdSchema,
  evaluationIds: z.array(objectIdSchema).max(MAX_SHOWCASE_QUOTES),
});

export type SetShowcaseQuotesData = z.input<typeof SetShowcaseQuotesSchema>;

/**
 * Choose which of the comments a team received appear on its public showcase
 * page.
 *
 * Two deliberate properties, both mirroring `setShowcaseConsent`:
 *
 * 1. It works on completed projects. The team hub goes read-only when a
 *    project ends, but the showcase page outlives the course by years and
 *    curating it is exactly the tidying-up that happens afterwards.
 * 2. Only the words are ever published, never the scores, and only comments
 *    the team can actually see — the ids are checked against evaluations of
 *    that team, so nothing can be published by guessing an id.
 */
export async function setShowcaseQuotes(
  data: SetShowcaseQuotesData
): Promise<ActionResult<void>> {
  const session = await requireSession();
  if (!session) return failure(ErrorMessages.NOT_LOGGED_IN);

  const validated = SetShowcaseQuotesSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      `Choose at most ${MAX_SHOWCASE_QUOTES} comments to publish`
    );
  }
  const { teamId, evaluationIds } = validated.data;

  try {
    await connectToDatabase();
    const team = await Team.findById(teamId);
    if (!team) return failure(ErrorMessages.NOT_FOUND("Team"));

    const isMember = team.members.some(
      (member: ObjectId) => member.toString() === session.user.id
    );
    if (!isMember && !isTeacher(session)) {
      return failure(ErrorMessages.NOT_AUTHORIZED);
    }

    // Keep the team's order, drop repeats.
    const chosen = [...new Set(evaluationIds)];
    if (chosen.length > 0) {
      const publishable = await TeamEvaluation.find(
        {
          _id: { $in: chosen },
          team: team._id,
          comment: { $nin: ["", null] },
        },
        { _id: 1 }
      ).lean();
      const allowed = new Set(
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        (publishable as any[]).map((row) => String(row._id))
      );
      if (chosen.some((id) => !allowed.has(id))) {
        return failure("You can only publish comments your team received");
      }
    }

    team.set({ showcaseQuotes: chosen });
    await team.save();
    return successNoData(
      chosen.length === 0
        ? "Nothing is published on your showcase page"
        : `Publishing ${chosen.length} comment${chosen.length === 1 ? "" : "s"}`
    );
  } catch (error) {
    return handleActionError(
      "setShowcaseQuotes",
      error,
      ErrorMessages.FAILED_TO_UPDATE("showcase comments")
    );
  }
}
