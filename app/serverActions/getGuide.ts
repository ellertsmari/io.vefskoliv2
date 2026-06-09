"use server";
import { Types } from "mongoose";
import { auth } from "../../auth";
import { Guide, GuideType } from "models/guide";
import { connectToDatabase } from "./mongoose-connector";
import { sanitizeGuideForClient } from "utils/exerciseUtils";
import { safeSerialize } from "utils/serialization";
import { hasTeacherPermissions } from "utils/userUtils";
import type { ClientGuide } from "types/guideTypes";

const findGuide = async (id: string): Promise<GuideType | null> => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  await connectToDatabase();
  const guide = await Guide.findById(new Types.ObjectId(id)).lean<GuideType>();
  return guide ?? null;
};

/**
 * Fetch a guide for student/public views.
 *
 * Sanitized BY DEFAULT: the raw `exercise` (which contains the quiz answer key)
 * is replaced with a client-safe version before this function returns, so no
 * caller can accidentally serialize the answer key to the browser. Teacher
 * tooling that needs the answer key must use `getGuideForTeacher` instead.
 */
export const getGuide = async (id: string): Promise<ClientGuide | null> => {
  const guide = await findGuide(id);
  if (!guide) return null;
  return sanitizeGuideForClient(
    safeSerialize(guide) as Record<string, unknown>
  ) as unknown as ClientGuide;
};

/**
 * Fetch a guide INCLUDING the exercise answer key, for the guide editor.
 * Teacher-only; returns null for anyone else.
 */
export const getGuideForTeacher = async (
  id: string
): Promise<GuideType | null> => {
  const session = await auth();
  if (!hasTeacherPermissions(session)) {
    return null;
  }
  const guide = await findGuide(id);
  return guide ? safeSerialize(guide) : null;
};
