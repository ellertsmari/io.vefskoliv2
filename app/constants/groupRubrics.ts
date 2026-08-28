import { RubricItem } from "./groupWork";
import MODULE_RUBRICS from "./moduleRubrics.json";

/**
 * The canonical presentation rubric for each module's group project,
 * transcribed from the project-description docs in `docs/`.
 *
 * This JSON is the single source of truth: `scripts/seedGroupProjects.mjs`
 * reads the same file, and teachers load a preset from it in the project
 * settings rubric editor. Kept out of `groupWork.ts` on purpose — every group
 * page imports that module, and only the teacher settings tab needs this.
 */
export const MODULE_RUBRIC_PRESETS: Record<number, RubricItem[]> =
  MODULE_RUBRICS as Record<number, RubricItem[]>;

/** Modules that have a preset rubric, ascending. */
export const MODULES_WITH_PRESET = Object.keys(MODULE_RUBRIC_PRESETS)
  .map(Number)
  .sort((a, b) => a - b);

export function rubricPresetForModule(
  module: number | null | undefined
): RubricItem[] | null {
  if (module == null) return null;
  return MODULE_RUBRIC_PRESETS[module] ?? null;
}
