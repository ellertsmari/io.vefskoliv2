import { z } from "zod";
import type { ActivityCycle, ActivityEntry, ActivityProgress } from "types/activityLogTypes";

export const activityDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
  (s) => !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s,
  "Choose a valid date"
);
export const activityCycleSchema = z.object({
  label: z.string().trim().min(1).max(100),
  activityCapMinutes: z.number().int().min(1).max(60000),
  periods: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
    label: z.string().trim().min(1).max(80),
    startDate: activityDateSchema,
    endDate: activityDateSchema,
    targetMinutes: z.number().int().min(1).max(60000),
  })).min(2).max(6),
}).superRefine((cycle, ctx) => {
  const ids = new Set<string>();
  cycle.periods.forEach((p, i) => {
    if (p.endDate < p.startDate || (i > 0 && p.startDate <= cycle.periods[i - 1].endDate)) {
      ctx.addIssue({ code: "custom", path: ["periods", i], message: "Periods must be in date order and must not overlap" });
    }
    if (ids.has(p.id)) ctx.addIssue({ code: "custom", path: ["periods", i], message: "Period IDs must be unique" });
    ids.add(p.id);
  });
});

export const normalizeActivityName = (name: string) => name.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en");

export function formatActivityTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? (h ? `${h}h ${m}m` : `${m}m`) : `${h}h`;
}

/** Approved minutes are capped per activity, oldest date first. Carry only moves
 * forward, and always stays within this cycle. No rounded decimal-hour totals. */
export function calculateActivityProgress(
  entries: Pick<ActivityEntry, "id" | "sessions" | "status">[],
  cycle: Pick<ActivityCycle, "periods" | "activityCapMinutes">
): ActivityProgress {
  const periods = cycle.periods.map((p) => ({ ...p, recordedMinutes: 0, eligibleMinutes: 0, carriedInMinutes: 0, creditedMinutes: 0, remainingMinutes: p.targetMinutes }));
  let pendingMinutes = 0;
  const entryCredits: Record<string, number> = {};
  for (const entry of entries) {
    let available = cycle.activityCapMinutes;
    entryCredits[entry.id] = 0;
    for (const session of [...entry.sessions].sort((a, b) => a.date.localeCompare(b.date))) {
      const period = periods.find((p) => session.date >= p.startDate && session.date <= p.endDate);
      if (!period || !Number.isInteger(session.minutes) || session.minutes <= 0) continue;
      period.recordedMinutes += session.minutes;
      if (entry.status === "pending") pendingMinutes += session.minutes;
      if (entry.status !== "approved") continue;
      const credited = Math.min(available, session.minutes);
      available -= credited;
      period.eligibleMinutes += credited;
      entryCredits[entry.id] += credited;
    }
  }
  let carry = 0;
  for (const period of periods) {
    period.carriedInMinutes = carry;
    const available = period.eligibleMinutes + carry;
    period.creditedMinutes = Math.min(period.targetMinutes, available);
    period.remainingMinutes = period.targetMinutes - period.creditedMinutes;
    carry = Math.max(0, available - period.targetMinutes);
  }
  return {
    periods,
    recordedMinutes: periods.reduce((sum, p) => sum + p.recordedMinutes, 0),
    eligibleMinutes: periods.reduce((sum, p) => sum + p.eligibleMinutes, 0),
    creditedMinutes: periods.reduce((sum, p) => sum + p.creditedMinutes, 0),
    targetMinutes: periods.reduce((sum, p) => sum + p.targetMinutes, 0),
    pendingMinutes,
    complete: periods.length > 0 && periods.every((p) => p.remainingMinutes === 0),
    entryCredits,
  };
}

/** Escape both CSV syntax and spreadsheet formula prefixes. */
export function activityCsvCell(value: string | number): string {
  const text = String(value);
  return `"${(/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`;
}
