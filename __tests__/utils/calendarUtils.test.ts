import {
  CalendarEventInputSchema,
  canEditEvent,
  canViewEvent,
  defaultCategoryForRole,
  eachDateInRange,
  isTimedCategory,
  normalizeEventInput,
  type CalendarEventInput,
} from "utils/calendarUtils";

const timedInput = (
  overrides: Partial<CalendarEventInput> = {}
): CalendarEventInput => ({
  title: "TypeScript lecture",
  category: "lecture",
  startDate: "2026-08-19",
  startTime: "10:00",
  endTime: "11:30",
  visibility: "everyone",
  sharedWith: [],
  ...overrides,
});

const rangedInput = (
  overrides: Partial<CalendarEventInput> = {}
): CalendarEventInput => ({
  title: "Group work week",
  category: "groupwork",
  startDate: "2026-09-07",
  endDate: "2026-09-11",
  visibility: "everyone",
  sharedWith: [],
  ...overrides,
});

describe("permissions", () => {
  const ownEvent = { owner: "alice" };
  const otherEvent = { owner: "bob" };
  const schoolEvent = { owner: null };

  it("lets teachers edit anything, including seeded school events", () => {
    expect(canEditEvent("teacher", "alice", ownEvent)).toBe(true);
    expect(canEditEvent("teacher", "alice", otherEvent)).toBe(true);
    expect(canEditEvent("teacher", "alice", schoolEvent)).toBe(true);
  });

  it("lets students edit only their own events", () => {
    expect(canEditEvent("user", "alice", ownEvent)).toBe(true);
    expect(canEditEvent("user", "alice", otherEvent)).toBe(false);
    expect(canEditEvent("user", "alice", schoolEvent)).toBe(false);
  });

  it("shows everyone-events to all, restricted ones to owner/shared/teachers", () => {
    const restricted = {
      owner: "alice",
      visibility: "restricted",
      sharedWith: ["bob"],
    };
    expect(canViewEvent("user", "carol", { visibility: "everyone" })).toBe(true);
    expect(canViewEvent("user", "alice", restricted)).toBe(true); // owner
    expect(canViewEvent("user", "bob", restricted)).toBe(true); // shared with
    expect(canViewEvent("user", "carol", restricted)).toBe(false); // outsider
    expect(canViewEvent("teacher", "dave", restricted)).toBe(true); // teacher
  });
});

describe("role defaults", () => {
  it("defaults students to Module 2 events and teachers to lectures", () => {
    expect(defaultCategoryForRole("user")).toBe("module2");
    expect(defaultCategoryForRole(undefined)).toBe("module2");
    expect(defaultCategoryForRole("teacher")).toBe("lecture");
  });

  it("classifies categories as timed vs ranged", () => {
    expect(isTimedCategory("lecture")).toBe(true);
    expect(isTimedCategory("module2")).toBe(true);
    expect(isTimedCategory("guide")).toBe(false);
    expect(isTimedCategory("groupwork")).toBe(false);
    expect(isTimedCategory("holiday")).toBe(false);
  });
});

describe("validation", () => {
  it("accepts a valid timed event", () => {
    expect(CalendarEventInputSchema.safeParse(timedInput()).success).toBe(true);
  });

  it("requires start and end times on timed categories", () => {
    const result = CalendarEventInputSchema.safeParse(
      timedInput({ startTime: undefined, endTime: undefined })
    );
    expect(result.success).toBe(false);
  });

  it("rejects a timed event ending before it starts", () => {
    const result = CalendarEventInputSchema.safeParse(
      timedInput({ startTime: "11:00", endTime: "10:00" })
    );
    expect(result.success).toBe(false);
  });

  it("accepts a valid ranged event and rejects a backwards range", () => {
    expect(CalendarEventInputSchema.safeParse(rangedInput()).success).toBe(
      true
    );
    const backwards = CalendarEventInputSchema.safeParse(
      rangedInput({ endDate: "2026-09-01" })
    );
    expect(backwards.success).toBe(false);
  });

  it("requires an end date on ranged categories", () => {
    const result = CalendarEventInputSchema.safeParse(
      rangedInput({ endDate: undefined })
    );
    expect(result.success).toBe(false);
  });
});

describe("normalizeEventInput", () => {
  it("collapses timed events to a single day and strips times from ranged ones", () => {
    const timed = normalizeEventInput(timedInput());
    expect(timed.endDate).toBe(timed.startDate);
    expect(timed.startTime).toBe("10:00");

    const ranged = normalizeEventInput(
      rangedInput({ startTime: "10:00", endTime: "11:00" })
    );
    expect(ranged.startTime).toBeUndefined();
    expect(ranged.endTime).toBeUndefined();
    expect(ranged.endDate).toBe("2026-09-11");
  });

  it("clears sharedWith unless visibility is restricted", () => {
    const open = normalizeEventInput(
      timedInput({ visibility: "everyone", sharedWith: ["x".repeat(24)] })
    );
    expect(open.sharedWith).toEqual([]);

    const restricted = normalizeEventInput(
      timedInput({ visibility: "restricted", sharedWith: ["abc"] })
    );
    expect(restricted.sharedWith).toEqual(["abc"]);
  });
});

describe("eachDateInRange", () => {
  it("expands a range inclusively", () => {
    expect(eachDateInRange("2026-09-07", "2026-09-09")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
    ]);
  });

  it("handles single days and month boundaries", () => {
    expect(eachDateInRange("2026-08-17", "2026-08-17")).toEqual([
      "2026-08-17",
    ]);
    expect(eachDateInRange("2026-08-31", "2026-09-01")).toEqual([
      "2026-08-31",
      "2026-09-01",
    ]);
  });

  it("caps absurd ranges instead of looping forever", () => {
    const dates = eachDateInRange("2026-01-01", "2099-01-01");
    expect(dates.length).toBeLessThanOrEqual(180);
  });
});
