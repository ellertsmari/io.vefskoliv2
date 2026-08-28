"use server";
import { connectToDatabase } from "../mongoose-connector";
import { GroupProject } from "models/groupProject";
import { logError } from "utils/errors";
import { RubricItem } from "constants/groupWork";
import { RubricSource } from "types/groupTypes";
import { isTeacher, requireSession } from "./helpers";

/**
 * Every other project that already has a rubric, so a teacher can copy one
 * instead of retyping it. Only the rubric travels — titles and dates stay on
 * the project being edited.
 */
export async function getRubricLibrary(
  excludeProjectId?: string
): Promise<RubricSource[]> {
  const session = await requireSession();
  if (!session || !isTeacher(session)) return [];

  try {
    await connectToDatabase();
    const projects = await GroupProject.find(
      { "rubric.0": { $exists: true } },
      { title: 1, module: 1, rubric: 1 }
    )
      .sort({ module: 1, startDate: -1 })
      .lean<
        { _id: unknown; title: string; module?: number; rubric: RubricItem[] }[]
      >();

    return projects
      .filter((project) => String(project._id) !== excludeProjectId)
      .map((project) => ({
        _id: String(project._id),
        title: project.title,
        module: project.module ?? null,
        rubric: project.rubric.map((item) => ({
          key: item.key,
          title: item.title,
          description: item.description || "",
          discipline: item.discipline || "general",
        })),
      }));
  } catch (error) {
    logError("getRubricLibrary", error, { excludeProjectId });
    return [];
  }
}
