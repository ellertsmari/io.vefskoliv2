/** @jest-environment node */
import { activityCycleSchema, calculateActivityProgress, formatActivityTime, normalizeActivityName, activityCsvCell } from "utils/activityLog";
import { extendGuides } from "utils/guideUtils";
import { resolveCanvasScore } from "app/lib/canvas/resolveScore";
import { GuideInfo, ReturnStatus, ReviewStatus } from "types/guideTypes";
import type { ActivityCycle, ActivityEntry } from "types/activityLogTypes";

const cycle: ActivityCycle = { id: "year", guideId: "guide", label: "2025–2026", activityCapMinutes: 600, periods: [
  { id: "autumn", label: "Autumn", startDate: "2025-08-01", endDate: "2025-12-31", targetMinutes: 900 },
  { id: "spring", label: "Spring", startDate: "2026-01-01", endDate: "2026-07-31", targetMinutes: 900 },
] };
const entry = (id: string, minutes: number, date = "2025-10-10", status: ActivityEntry["status"] = "approved") => ({ id, sessions: [{ date, minutes }], status });
const hours = (autumn: number, spring: number) => {
  const entries = [];
  for (let i = 0; i < autumn; i++) entries.push(entry(`a${i}`, 60));
  for (let i = 0; i < spring; i++) entries.push(entry(`s${i}`, 60, "2026-02-10"));
  return entries;
};

describe("activity credit", () => {
  it.each([[15,15,0,true], [20,10,5,true], [25,5,10,true], [30,0,15,true], [10,20,0,false], [0,30,0,false]])("allocates %ih autumn and %ih spring", (a, s, carry, complete) => {
    const progress = calculateActivityProgress(hours(a, s), cycle);
    expect(progress.complete).toBe(complete);
    expect(progress.periods[1].carriedInMinutes).toBe(carry * 60);
    expect(progress.periods[0].creditedMinutes).toBe(Math.min(a, 15) * 60);
    expect(progress.recordedMinutes).toBe((a + s) * 60);
  });
  it("caps one activity across dates and semesters, allocating oldest time first", () => {
    const p = calculateActivityProgress([{ id: "same-activity", status: "approved", sessions: [{ date: "2026-02-01", minutes: 480 }, { date: "2025-11-01", minutes: 420 }] }], cycle);
    expect(p.recordedMinutes).toBe(900);
    expect(p.eligibleMinutes).toBe(600);
    expect(p.periods.map((p) => p.eligibleMinutes)).toEqual([420, 180]);
  });
  it("does not let unapproved entries affect earned credit", () => {
    const p = calculateActivityProgress([entry("draft", 120, undefined, "draft"), entry("pending", 180, undefined, "pending"), entry("changes", 60, undefined, "changesRequested"), entry("approved", 90)], cycle);
    expect(p.eligibleMinutes).toBe(90);
    expect(p.recordedMinutes).toBe(450);
    expect(p.pendingMinutes).toBe(180);
  });
  it("recalculates carry after approval is revoked", () => {
    const entries = hours(20, 10);
    expect(calculateActivityProgress(entries, cycle).complete).toBe(true);
    entries[0].status = "changesRequested";
    const p = calculateActivityProgress(entries, cycle);
    expect(p.complete).toBe(false);
    expect(p.periods[1].remainingMinutes).toBe(60);
  });
  it("uses exact minutes at target boundaries", () => {
    const p = calculateActivityProgress([...hours(15, 14), entry("extra", 45, "2026-02-01")], cycle);
    expect(p.periods[1].remainingMinutes).toBe(15);
    expect(formatActivityTime(45)).toBe("45m");
    expect(formatActivityTime(615)).toBe("10h 15m");
  });
  it("keeps excess beyond both targets without increasing completion past 100%", () => {
    const p = calculateActivityProgress(hours(40, 20), cycle);
    expect(p.recordedMinutes).toBe(3600);
    expect(p.creditedMinutes).toBe(1800);
  });
  it("does not include another year's dates and handles semester boundaries", () => {
    const p = calculateActivityProgress([entry("old", 600, "2024-10-01"), entry("last", 30, "2025-12-31"), entry("first", 45, "2026-01-01"), entry("later", 600, "2026-08-01")], cycle);
    expect(p.periods.map((p) => p.eligibleMinutes)).toEqual([30, 45]);
  });
  it("validates real dates, ordered non-overlapping periods and unique identities", () => {
    expect(activityCycleSchema.safeParse(cycle).success).toBe(true);
    for (const patch of [{ startDate: "2025-12-31" }, { endDate: "2026-02-30" }, { id: "autumn" }]) {
      expect(activityCycleSchema.safeParse({ ...cycle, periods: [cycle.periods[0], { ...cycle.periods[1], ...patch }] }).success).toBe(false);
    }
  });
  it("normalizes names and prevents exported formulas", () => {
    expect(normalizeActivityName("  WEB   Meetup ")).toBe("web meetup");
    expect(activityCsvCell('=SUM(1,2)')).toBe('"\'=SUM(1,2)"');
    expect(activityCsvCell('Anna "A"')).toBe('"Anna ""A"""');
  });
  it("integrates progress without peer-review requirements or premature Canvas grades", () => {
    const guide = { _id: "id", submissionType: "activityLog", activityProgress: calculateActivityProgress(hours(20, 5), cycle) } as unknown as GuideInfo;
    const [extended] = extendGuides([guide]);
    expect(extended.returnStatus).toBe(ReturnStatus.IN_PROGRESS);
    expect(extended.reviewStatus).toBe(ReviewStatus.NOT_APPLICABLE);
    expect(extended.grade).toBeUndefined();
    expect(resolveCanvasScore(extended)).toEqual({ scoreMaximum: 10, activityProgress: "InProgress", gradingProgress: "NotReady" });
    guide.activityProgress = calculateActivityProgress(hours(20, 10), cycle);
    const [complete] = extendGuides([guide]);
    expect(complete.returnStatus).toBe(ReturnStatus.PASSED);
    expect(resolveCanvasScore(complete).scoreGiven).toBe(10);
  });
});
