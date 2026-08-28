import { CanvasCourseType } from "models/canvasCourse";
import { extractModuleNumber } from "utils/moduleUtils";
import { getDiscipline } from "utils/guideTaxonomy";

export type CanvasTrack = "code" | "design" | "group";

/** What a guide is, in the terms the Canvas course split uses. */
type RoutableGuide = {
  module: { title: string; number?: number };
  discipline?: string | null;
  category?: string | null;
};

/**
 * The (module, track) pair a guide belongs to.
 *
 * The module number comes from the module TITLE, never `module.number`: that
 * field is unreliable in the database and reading it directly is how per-module
 * grouping silently corrupts (see utils/moduleUtils).
 */
export const guideSelector = (
  guide: RoutableGuide
): { moduleNumber: number; track: CanvasTrack } => ({
  moduleNumber: extractModuleNumber(guide.module.title),
  track: getDiscipline(guide),
});

export type CourseRouting =
  | { kind: "matched"; course: CanvasCourseType }
  /** The guide's module/track has no Canvas course configured at all. */
  | { kind: "unmapped"; moduleNumber: number; track: CanvasTrack }
  /** Courses exist, but this student is enrolled in none of them. */
  | { kind: "notEnrolled"; candidates: CanvasCourseType[] }
  /** The student is in more than one course claiming this guide. */
  | { kind: "ambiguous"; candidates: CanvasCourseType[] };

/**
 * Pick the Canvas course a student's grade for a guide belongs in.
 *
 * A guide alone is not enough: module 3's code guides are taught in both
 * VFOR4WD03AA and VFOR4WD03BA, so the answer is the intersection of "courses
 * claiming this guide" and "courses this student is enrolled in". Enrolment
 * comes from the Canvas roster (`CanvasUser`), which is why the cohort split
 * needs no cohort field on `User` — Canvas is already the authority on who sits
 * in which section, and a second copy could only ever disagree with it.
 *
 * Every failure is a distinct return value rather than a null or a throw,
 * because they need different humans: `unmapped` is a setup step nobody has done
 * yet, `notEnrolled` is usually a student missing from Canvas, and `ambiguous`
 * is a genuine misconfiguration — two courses claiming the same guide for the
 * same student. Guessing between them is how grades land in the wrong course.
 */
export const selectCourseForGuide = (
  guide: RoutableGuide,
  courses: CanvasCourseType[],
  enrolledContextIds: ReadonlySet<string>
): CourseRouting => {
  const { moduleNumber, track } = guideSelector(guide);

  const candidates = courses.filter(
    (course) =>
      course.syncEnabled &&
      course.selectors.some(
        (selector) =>
          selector.moduleNumber === moduleNumber && selector.track === track
      )
  );

  if (candidates.length === 0) {
    return { kind: "unmapped", moduleNumber, track };
  }

  const enrolled = candidates.filter((course) =>
    enrolledContextIds.has(course.contextId)
  );

  if (enrolled.length === 0) return { kind: "notEnrolled", candidates };
  if (enrolled.length > 1) return { kind: "ambiguous", candidates: enrolled };

  return { kind: "matched", course: enrolled[0] };
};
