"use server";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "../../auth";
import { Guide } from "../models/guide";
import { Return } from "../models/return";
import { ExerciseAttempt } from "../models/exerciseAttempt";
import { ActivityEntryModel } from "../models/activityEntry";
import { ActivityCycleModel } from "../models/activityCycle";
import { isActingAsTeacher } from "../utils/userUtils";
import { getDiscipline, getIsSpecialty } from "../utils/guideTaxonomy";
import { extractModuleNumber } from "../utils/moduleUtils";
import { isoDate } from "../utils/serialization";
import {
  failure,
  successNoData,
  handleActionError,
  ErrorMessages,
  type ActionResult,
} from "../utils/errors";

/** One row of the teacher's guide list: enough to find a guide, no more. */
export type EditorGuideRow = {
  id: string;
  title: string;
  description: string;
  moduleTitle: string;
  moduleNumber: number;
  order: number;
  discipline: "code" | "design";
  isSpecialty: boolean;
  gradingMode: "peerReview" | "auto";
  submissionType?: "activityLog";
  /** ISO date. */
  updatedAt: string;
};

type LeanGuide = {
  _id: ObjectId;
  title: string;
  description?: string;
  module?: { title?: string };
  /** A number in the schema, but hand-imported guides have carried strings. */
  order?: unknown;
  discipline?: string;
  isSpecialty?: boolean;
  category?: string;
  gradingMode?: string;
  submissionType?: "activityLog";
  updatedAt?: unknown;
};

/**
 * Every guide, for the editor's list. Sorted by module then order, which is
 * the order students meet them in. Teachers only.
 */
export async function getGuidesForEditor(): Promise<EditorGuideRow[]> {
  const session = await auth();
  if (!isActingAsTeacher(session)) return [];

  try {
    const rows = await Guide.find(
      {},
      {
        title: 1,
        description: 1,
        module: 1,
        order: 1,
        discipline: 1,
        isSpecialty: 1,
        category: 1,
        gradingMode: 1,
        submissionType: 1,
        updatedAt: 1,
      }
    ).lean<LeanGuide[]>();

    return rows
      .map((row) => ({
        id: String(row._id),
        title: row.title,
        submissionType: row.submissionType,
        description: row.description ?? "",
        moduleTitle: row.module?.title ?? "",
        moduleNumber: extractModuleNumber(row.module?.title ?? ""),
        order: Number(row.order) || 0,
        discipline: getDiscipline(row),
        isSpecialty: getIsSpecialty(row),
        gradingMode: (row.gradingMode === "auto" ? "auto" : "peerReview") as EditorGuideRow["gradingMode"],
        updatedAt: isoDate(row.updatedAt),
      }))
      .sort(
        (a, b) =>
          a.moduleNumber - b.moduleNumber ||
          a.order - b.order ||
          a.title.localeCompare(b.title)
      );
  } catch (error) {
    handleActionError("getGuidesForEditor", error);
    return [];
  }
}

/** Remove a guide. Teachers only; the list confirms before calling this. */
export async function deleteGuide(guideId: string): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session?.user?.id) return failure(ErrorMessages.NOT_LOGGED_IN);
  if (!isActingAsTeacher(session)) return failure(ErrorMessages.NOT_AUTHORIZED);
  if (!ObjectId.isValid(guideId)) return failure(ErrorMessages.NOT_FOUND("Guide"));

  try {
    const id = new ObjectId(guideId);
    // A guide that students have worked on stays. Grades are read starting
    // from the guide, so deleting it would silently drop every return, review
    // and score on it from each student's average, with nothing to restore.
    const [returned, attempted, logged] = await Promise.all([
      Return.exists({ guide: id }),
      ExerciseAttempt.exists({ guide: id }),
      ActivityEntryModel.exists({ guide: id }),
    ]);
    if (returned || attempted || logged) {
      return failure(
        "Students have already worked on this guide, so it cannot be deleted. Their returns, exercise attempts or logged activities would be lost from their grades."
      );
    }
    const result = await Guide.deleteOne({ _id: id });
    if (result.deletedCount === 0) return failure(ErrorMessages.NOT_FOUND("Guide"));
    // Reporting years belong to the guide and hold nothing once it has no
    // activities (checked above).
    await ActivityCycleModel.deleteMany({ guide: id });
    revalidatePath("/guides");
    revalidatePath("/LMS/edit-guides");
    return successNoData("Guide deleted");
  } catch (error) {
    return handleActionError("deleteGuide", error, "Failed to delete the guide");
  }
}
