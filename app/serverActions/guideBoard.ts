import { getGuides } from "./getGuides";
import { getPublicGuides } from "./getPublicGuides";
import { extendGuides, fetchModules } from "utils/guideUtils";
import { extractModuleNumber } from "utils/moduleUtils";
import { createPublicGuideInfo } from "utils/publicGuideUtils";
import { safeSerialize } from "utils/serialization";
import { ExtendedGuideInfo, GuideInfo, Module } from "types/guideTypes";

// Not a server action (no "use server"): server components call these
// directly, so they are not exposed as endpoints a browser can call.

/** Guides with their statuses and the modules they belong to, ready to hand
 * to a client component. */
export type GuideBoard = { guides: ExtendedGuideInfo[]; modules: Module[] };

/**
 * The module number comes from the title ("3 - Undirstöður" is module 3). The
 * stored `module.number` can't be trusted: guides were imported by hand and
 * some carry a stale or missing number. Setting it here, once, means
 * everything downstream can read `guide.module.number`.
 */
const withModuleNumber = <T extends GuideInfo>(guide: T): T => ({
  ...guide,
  module: {
    ...guide.module,
    number: extractModuleNumber(guide.module.title),
  },
});

const toBoard = (guides: GuideInfo[]): GuideBoard => {
  const extended = extendGuides(guides.map(withModuleNumber));
  return {
    // getGuides serializes, but merging old exercise attempts afterwards puts
    // an ObjectId and a Date back, so this pass is still needed.
    guides: safeSerialize(extended),
    modules: fetchModules(extended),
  };
};

/**
 * A student's guide board. Teachers may pass a student's id; anyone else gets
 * their own guides whatever they pass (getGuides enforces that). Throws when
 * the guides can't be loaded, so the page shows its error state rather than
 * an empty board. Empty when nobody is signed in.
 */
export async function loadStudentGuideBoard(
  userId?: string
): Promise<GuideBoard> {
  return toBoard((await getGuides(userId)) ?? []);
}

/**
 * The guide board for visitors without an account: every guide, no personal
 * statuses. Null when the guides can't be loaded.
 */
export async function loadPublicGuideBoard(): Promise<GuideBoard | null> {
  const guides = await getPublicGuides();
  return guides ? toBoard(guides.map(createPublicGuideInfo)) : null;
}
