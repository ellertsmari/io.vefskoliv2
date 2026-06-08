/**
 * Guide taxonomy: two orthogonal axes.
 *
 *   discipline:  "code" | "design"
 *   isSpecialty: boolean   (specialty guides are optional/extra)
 *
 * Historically these were mashed into a single `category` enum
 * ("code" | "design" | "codeSpeciality" | "designSpeciality"), which invited a
 * combinatorial blow-up (every new axis multiplies the values) and string-match
 * bugs (e.g. checking `category === 'speciality code'`, which never matched the
 * real value `codeSpeciality`).
 *
 * `discipline` + `isSpecialty` are now the canonical fields. `category` is kept
 * on the document as a DERIVED mirror (written on save) so legacy/display/LTI
 * consumers keep working. Always read the axes through the helpers below — never
 * string-match `category` ad hoc again.
 */

export type Discipline = "code" | "design";

export const DISCIPLINES: readonly Discipline[] = ["code", "design"] as const;

export type GuideAxes = { discipline: Discipline; isSpecialty: boolean };

/** Anything we can read taxonomy from — a full guide, a lean doc, or a fixture. */
type GuideLike = {
  discipline?: string | null;
  isSpecialty?: boolean | null;
  category?: string | null;
};

/** Derive the orthogonal axes from a legacy `category` string. */
export const categoryToAxes = (category?: string | null): GuideAxes => {
  switch (category) {
    case "design":
      return { discipline: "design", isSpecialty: false };
    case "codeSpeciality":
      return { discipline: "code", isSpecialty: true };
    case "designSpeciality":
      return { discipline: "design", isSpecialty: true };
    case "code":
    default:
      // Unknown/empty values fall back to the most common case.
      return { discipline: "code", isSpecialty: false };
  }
};

/** Build the legacy `category` string from the axes (the derived mirror). */
export const axesToCategory = (
  discipline: Discipline,
  isSpecialty: boolean
): string => {
  if (discipline === "design") return isSpecialty ? "designSpeciality" : "design";
  return isSpecialty ? "codeSpeciality" : "code";
};

/**
 * Read a guide's discipline. Prefers the canonical `discipline` field and falls
 * back to deriving from `category`, so this is correct whether or not a guide has
 * been migrated.
 */
export const getDiscipline = (guide: GuideLike): Discipline =>
  guide.discipline === "code" || guide.discipline === "design"
    ? guide.discipline
    : categoryToAxes(guide.category).discipline;

/** Read whether a guide is a specialty guide (canonical field, else derived). */
export const getIsSpecialty = (guide: GuideLike): boolean =>
  typeof guide.isSpecialty === "boolean"
    ? guide.isSpecialty
    : categoryToAxes(guide.category).isSpecialty;

export const isCodeGuide = (guide: GuideLike): boolean =>
  getDiscipline(guide) === "code";

/** Convenience for call sites that only have a legacy `category` string. */
export const isCodeCategory = (category?: string | null): boolean =>
  categoryToAxes(category).discipline === "code";

export const isDesignGuide = (guide: GuideLike): boolean =>
  getDiscipline(guide) === "design";
