/**
 * @jest-environment node
 */
import { Types } from "mongoose";
import { CanvasCourseType } from "models/canvasCourse";
import {
  guideSelector,
  selectCourseForGuide,
} from "../../../app/lib/canvas/routing";

const course = (
  contextId: string,
  courseCode: string,
  selectors: Array<{ moduleNumber: number; track: "code" | "design" | "group" }>,
  syncEnabled = true
): CanvasCourseType =>
  ({
    _id: new Types.ObjectId(),
    contextId,
    courseCode,
    issuer: "https://canvas.instructure.com",
    deploymentId: "1:abc",
    selectors,
    syncEnabled,
  }) as CanvasCourseType;

const codeGuideModule3 = {
  module: { title: "3 - Undirstöður forritunar", number: 3 },
  discipline: "code",
  category: "code",
};

const designGuideModule2 = {
  module: { title: "2 - Undirstöður í hönnun", number: 2 },
  discipline: "design",
  category: "design",
};

// The AA/BA cohort split: the same guides taught in two parallel Canvas courses.
const VFOR_AA = course("ctx-vfor-aa", "VFOR4WD03AA", [
  { moduleNumber: 3, track: "code" },
]);
const VFOR_BA = course("ctx-vfor-ba", "VFOR4WD03BA", [
  { moduleNumber: 3, track: "code" },
]);
const VEFH_AA = course("ctx-vefh-aa", "VEFH4WD02AA", [
  { moduleNumber: 2, track: "design" },
]);

describe("guideSelector", () => {
  it("reads the module number from the title, not the number field", () => {
    // module.number is unreliable in the database; a double-digit module read
    // from the wrong place collapses onto a single-digit one.
    expect(
      guideSelector({ module: { title: "10 - Advanced", number: 1 } })
        .moduleNumber
    ).toBe(10);
  });

  it("falls back to the legacy category when discipline is unmigrated", () => {
    expect(
      guideSelector({
        module: { title: "4 - Something" },
        category: "designSpeciality",
      }).track
    ).toBe("design");
  });
});

describe("selectCourseForGuide", () => {
  it("routes a student to the cohort course they are actually enrolled in", () => {
    const result = selectCourseForGuide(
      codeGuideModule3,
      [VFOR_AA, VFOR_BA, VEFH_AA],
      new Set(["ctx-vfor-ba", "ctx-vefh-aa"])
    );

    expect(result).toMatchObject({
      kind: "matched",
      course: { courseCode: "VFOR4WD03BA" },
    });
  });

  it("keeps design guides out of the code course for the same module", () => {
    const result = selectCourseForGuide(
      designGuideModule2,
      [VFOR_AA, VFOR_BA, VEFH_AA],
      new Set(["ctx-vfor-aa", "ctx-vefh-aa"])
    );

    expect(result).toMatchObject({
      kind: "matched",
      course: { courseCode: "VEFH4WD02AA" },
    });
  });

  it("routes both guides and group work into one course in module 1", () => {
    // Module 1 folds the tracks together; a course claiming several selectors is
    // the supported shape, not a misconfiguration.
    const VLOK = course("ctx-vlok", "VLOK4WD06AA", [
      { moduleNumber: 1, track: "code" },
      { moduleNumber: 1, track: "design" },
      { moduleNumber: 1, track: "group" },
    ]);

    const result = selectCourseForGuide(
      { module: { title: "1 - Kynning" }, discipline: "design" },
      [VLOK],
      new Set(["ctx-vlok"])
    );

    expect(result).toMatchObject({ kind: "matched" });
  });

  it("reports an unmapped module/track rather than picking something close", () => {
    const result = selectCourseForGuide(
      { module: { title: "7 - Not set up yet" }, discipline: "code" },
      [VFOR_AA, VEFH_AA],
      new Set(["ctx-vfor-aa"])
    );

    expect(result).toEqual({ kind: "unmapped", moduleNumber: 7, track: "code" });
  });

  it("reports a student missing from every candidate roster", () => {
    const result = selectCourseForGuide(
      codeGuideModule3,
      [VFOR_AA, VFOR_BA],
      new Set(["ctx-vefh-aa"])
    );

    expect(result.kind).toBe("notEnrolled");
  });

  it("refuses to guess when a student is enrolled in both cohorts", () => {
    // Two courses claiming the same guide for the same student is a real
    // misconfiguration. Picking one would silently put grades in the wrong course.
    const result = selectCourseForGuide(
      codeGuideModule3,
      [VFOR_AA, VFOR_BA],
      new Set(["ctx-vfor-aa", "ctx-vfor-ba"])
    );

    expect(result.kind).toBe("ambiguous");
  });

  it("ignores courses that have not been switched on", () => {
    const off = course(
      "ctx-off",
      "VFOR4WD03AA",
      [{ moduleNumber: 3, track: "code" }],
      false
    );

    const result = selectCourseForGuide(
      codeGuideModule3,
      [off],
      new Set(["ctx-off"])
    );

    expect(result.kind).toBe("unmapped");
  });
});
