"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { Semester } from "../models/semester";
import { connectToDatabase } from "./mongoose-connector";
import { hasTeacherPermissions } from "../utils/userUtils";
import { DEFAULT_SEMESTER } from "../constants/semesterPlan";
import { SemesterInputSchema, type SemesterInput } from "../utils/calendarUtils";
import type { SemesterInfo } from "types/calendarTypes";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

/** The active semester, or the built-in default until a teacher saves one. */
export async function getSemester(): Promise<SemesterInfo> {
  const fallback: SemesterInfo = { ...DEFAULT_SEMESTER, saved: false };
  try {
    await connectToDatabase();
    const active = await Semester.findOne({ active: true }).lean<{
      label: string;
      startDate: string;
      endDate: string;
      spann2Start?: string;
    }>();
    if (!active) return fallback;
    return {
      label: active.label,
      startDate: active.startDate,
      endDate: active.endDate,
      spann2Start: active.spann2Start || undefined,
      saved: true,
    };
  } catch (error) {
    handleActionError("getSemester", error);
    return fallback;
  }
}

/** Teachers only. There is one active semester; saving edits it in place. */
export async function saveSemester(
  data: SemesterInput
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!hasTeacherPermissions(session)) return failure(ErrorMessages.NOT_AUTHORIZED);

  const validated = SemesterInputSchema.safeParse(data);
  if (!validated.success) {
    return failure(
      ErrorMessages.INVALID_INPUT,
      validated.error.flatten().fieldErrors
    );
  }
  const { label, startDate, endDate, spann2Start } = validated.data;

  try {
    await connectToDatabase();
    const fields = { label, startDate, endDate, active: true };
    await Semester.findOneAndUpdate(
      { active: true },
      spann2Start
        ? { $set: { ...fields, spann2Start } }
        : { $set: fields, $unset: { spann2Start: "" } },
      { upsert: true }
    );
    revalidatePath("/LMS/calendar");
    return successNoData("Semester saved");
  } catch (error) {
    return handleActionError("saveSemester", error, "Failed to save the semester");
  }
}
