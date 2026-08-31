/**
 * @jest-environment node
 */
import {
  clampGrade,
  peerGradeFactor,
  projectGradeFromScores,
} from "constants/groupWork";

// The arithmetic these numbers come from lives in the SustainableIsland LMS
// (API/Controllers/peerEvalController.js) and is kept identical here:
//   P = (C+2)(T+2) - 4 ; scale = P >= 0 ? 0.025 : 0.175 ; grade = (P*scale+1) * project
describe("individual grade arithmetic", () => {
  describe("peerGradeFactor", () => {
    it("leaves an average student's project grade alone", () => {
      expect(peerGradeFactor(0, 0)).toBeCloseTo(1, 10);
    });

    it("caps the boost at +30% and the penalty at −70%", () => {
      expect(peerGradeFactor(2, 2)).toBeCloseTo(1.3, 10);
      expect(peerGradeFactor(-2, -2)).toBeCloseTo(0.3, 10);
    });

    it("multiplies the axes rather than averaging them", () => {
      // Carried the work, impossible to work with: P = 4 × 0 − 4 = −4, the
      // same as having done nothing at all. Averaging the axes would have
      // called this student exactly average and changed nothing.
      expect(peerGradeFactor(2, -2)).toBeCloseTo(0.3, 10);
      expect(peerGradeFactor(-2, 2)).toBeCloseTo(0.3, 10);
      expect(peerGradeFactor(0, 0)).toBeGreaterThan(peerGradeFactor(2, -2));
    });

    it("penalises harder than it rewards, by the same distance from average", () => {
      const above = peerGradeFactor(1, 1) - 1;
      const below = 1 - peerGradeFactor(-1, -1);
      expect(below).toBeGreaterThan(above);
    });

    it("reproduces a worked example", () => {
      // C = 0.7, T = -1.0 → P = 2.7 × 1.0 − 4 = −1.3 → factor 0.7725
      const factor = peerGradeFactor(0.7, -1);
      expect(factor).toBeCloseTo(0.7725, 6);
      expect(clampGrade(8 * factor)).toBe(6.2);
    });
  });

  describe("projectGradeFromScores", () => {
    const rubric = [
      { key: "product", title: "Product", description: "" },
      { key: "presentation", title: "Presentation", description: "" },
      { key: "qa", title: "Q&A", description: "" },
    ];

    it("averages the rubric rows", () => {
      expect(
        projectGradeFromScores(rubric, {
          product: { avg: 9 },
          presentation: { avg: 6 },
          qa: { avg: 6 },
        })
      ).toBeCloseTo(7, 10);
    });

    it("ignores rows nobody scored rather than counting them as zero", () => {
      expect(
        projectGradeFromScores(rubric, {
          product: { avg: 8 },
          qa: { avg: 6 },
        })
      ).toBeCloseTo(7, 10);
    });

    it("has no grade at all when nothing was scored", () => {
      expect(projectGradeFromScores(rubric, {})).toBeNull();
      expect(projectGradeFromScores(rubric, null)).toBeNull();
    });
  });

  describe("clampGrade", () => {
    it("holds a boosted grade to the top of the scale", () => {
      expect(clampGrade(9 * peerGradeFactor(2, 2))).toBe(10);
    });

    it("clamps only at the end, so a perfect row still carries its boost", () => {
      // A team with one perfect row and two middling ones, and a student with
      // the full +30%. Capping each row first would throw away the 3 points
      // above 10 on the perfect row and keep the shortfall on the others.
      const factor = peerGradeFactor(2, 2);
      const rows = [10, 5, 6];
      const cappedEarly =
        rows.map((row) => Math.min(10, row * factor)).reduce((a, b) => a + b) /
        rows.length;
      const cappedLate = clampGrade(
        (rows.reduce((a, b) => a + b) / rows.length) * factor
      );
      expect(cappedLate).toBe(9.1);
      expect(cappedEarly).toBeLessThan(cappedLate);
    });

    it("never goes below zero or carries more than one decimal", () => {
      expect(clampGrade(-3)).toBe(0);
      expect(clampGrade(6.1834)).toBe(6.2);
    });
  });
});
