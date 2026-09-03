import {
  CalendarEventInputSchema,
  CopyEventsInputSchema,
  MAX_REPEAT_WEEKS,
  SemesterInputSchema,
  addDays,
  addMinutes,
  allowedVisibilities,
  slotStarts,
  timesOverlap,
  weekdayOf,
  canEditEvent,
  describeDate,
  expandWeekly,
  normalizeTime,
  initialMonthIndex,
  normalizeEventInput,
  semesterMonths,
} from "utils/calendarUtils";

const valid = {
  title: "Lecture",
  category: "lecture" as const,
  startDate: "2026-09-02",
};

describe("CalendarEventInputSchema", () => {
  it("accepts a bare single-day event and treats empty optionals as absent", () => {
    const parsed = CalendarEventInputSchema.safeParse({
      ...valid,
      endDate: "",
      startTime: "",
      endTime: "",
      link: "",
      description: "   ",
      repeatWeeklyUntil: "",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(normalizeEventInput(parsed.data)).toEqual({
        title: "Lecture",
        description: undefined,
        category: "lecture",
        startDate: "2026-09-02",
        endDate: "2026-09-02",
        startTime: undefined,
        endTime: undefined,
        link: undefined,
      });
    }
  });

  it.each([
    ["a last day before the first", { endDate: "2026-09-01" }, "endDate"],
    ["an end time without a start", { endTime: "11:00" }, "startTime"],
    ["an end time before the start", { startTime: "11:00", endTime: "10:00" }, "endTime"],
    ["a link without a scheme", { link: "vefskolinn.is" }, "link"],
    ["a title over 120 characters", { title: "x".repeat(121) }, "title"],
    ["a repeat that ends before it starts", { repeatWeeklyUntil: "2026-09-02" }, "repeatWeeklyUntil"],
    [
      "a repeat longer than the cap",
      { repeatWeeklyUntil: addDays("2026-09-02", MAX_REPEAT_WEEKS * 7 + 1) },
      "repeatWeeklyUntil",
    ],
  ])("rejects %s", (_label, overrides, field) => {
    const parsed = CalendarEventInputSchema.safeParse({ ...valid, ...overrides });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors[field as "title"]).toBeDefined();
    }
  });
});

describe("expandWeekly", () => {
  it("repeats the span every seven days while the start is within the range", () => {
    expect(expandWeekly("2026-09-02", "2026-09-02", "2026-09-23")).toEqual([
      { startDate: "2026-09-02", endDate: "2026-09-02" },
      { startDate: "2026-09-09", endDate: "2026-09-09" },
      { startDate: "2026-09-16", endDate: "2026-09-16" },
      { startDate: "2026-09-23", endDate: "2026-09-23" },
    ]);
  });

  it("keeps multi-day spans the same length", () => {
    expect(expandWeekly("2026-09-01", "2026-09-03", "2026-09-10")).toEqual([
      { startDate: "2026-09-01", endDate: "2026-09-03" },
      { startDate: "2026-09-08", endDate: "2026-09-10" },
    ]);
  });

  it("never returns more than the cap", () => {
    expect(
      expandWeekly("2026-01-01", "2026-01-01", "2030-01-01")
    ).toHaveLength(MAX_REPEAT_WEEKS + 1);
  });
});

describe("semesterMonths", () => {
  it("lists every month from the first day to the last", () => {
    expect(semesterMonths("2026-08-17", "2026-12-21")).toEqual([
      { year: 2026, month: 7 },
      { year: 2026, month: 8 },
      { year: 2026, month: 9 },
      { year: 2026, month: 10 },
      { year: 2026, month: 11 },
    ]);
  });

  it("crosses a year boundary", () => {
    expect(semesterMonths("2026-12-01", "2027-02-10")).toEqual([
      { year: 2026, month: 11 },
      { year: 2027, month: 0 },
      { year: 2027, month: 1 },
    ]);
  });
});

describe("initialMonthIndex", () => {
  const months = semesterMonths("2026-08-17", "2026-12-21");

  it("opens on the current month during term", () => {
    expect(initialMonthIndex(months, "2026-11-03")).toBe(3);
  });

  it("opens on the first month before term and the last month after it", () => {
    expect(initialMonthIndex(months, "2026-06-01")).toBe(0);
    expect(initialMonthIndex(months, "2027-01-15")).toBe(4);
  });
});

describe("SemesterInputSchema", () => {
  it("requires Spönn 2 to start inside the term", () => {
    const parsed = SemesterInputSchema.safeParse({
      label: "Autumn",
      startDate: "2026-08-17",
      endDate: "2026-12-21",
      spann2Start: "2027-01-05",
    });
    expect(parsed.success).toBe(false);
  });

  it("caps a term at eight months", () => {
    const parsed = SemesterInputSchema.safeParse({
      label: "Year",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("CopyEventsInputSchema", () => {
  it("coerces the number of weeks", () => {
    const parsed = CopyEventsInputSchema.safeParse({
      fromDate: "2025-08-18",
      toDate: "2025-12-19",
      weeks: "52",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.weeks).toBe(52);
  });
});

describe("permissions", () => {
  it("lets teachers edit anything and students only their own", () => {
    expect(canEditEvent(true, "a", { owner: null })).toBe(true);
    expect(canEditEvent(false, "a", { owner: "a" })).toBe(true);
    expect(canEditEvent(false, "a", { owner: "b" })).toBe(false);
    expect(canEditEvent(false, "a", { owner: null })).toBe(false);
  });

  it("offers teachers 'everyone' and students the full choice", () => {
    expect(allowedVisibilities(true)).toEqual(["everyone"]);
    expect(allowedVisibilities(false)).toEqual([
      "everyone",
      "team",
      "shared",
      "private",
    ]);
  });

  it("requires people for a shared event", () => {
    const parsed = CalendarEventInputSchema.safeParse({
      ...valid,
      visibility: "shared",
      sharedWith: [],
    });
    expect(parsed.success).toBe(false);
  });
});

describe("normalizeTime", () => {
  it.each([
    ["9", "09:00"],
    ["9:5", "09:05"],
    ["930", "09:30"],
    ["14.30", "14:30"],
    ["14:30", "14:30"],
    ["0", "00:00"],
    ["", ""],
  ])("turns %p into %p", (raw, expected) => {
    expect(normalizeTime(raw)).toBe(expected);
  });

  it("leaves what it cannot read for validation to report", () => {
    expect(normalizeTime("25:00")).toBe("25:00");
    expect(normalizeTime("ten")).toBe("ten");
    expect(normalizeTime("2 pm")).toBe("2 pm");
  });
});

describe("describeDate", () => {
  it("spells the date out with its weekday", () => {
    expect(describeDate("2026-09-21")).toBe("Mon 21 September 2026");
    expect(describeDate("")).toBe("");
  });
});

describe("meeting slots", () => {
  it("adds minutes to a clock time", () => {
    expect(addMinutes("13:40", 20)).toBe("14:00");
    expect(addMinutes("23:50", 20)).toBe("00:10");
  });

  it("splits a window into slot starts that fit whole meetings", () => {
    expect(slotStarts("13:00", "14:00")).toEqual(["13:00", "13:20", "13:40"]);
    expect(slotStarts("13:00", "13:50")).toEqual(["13:00", "13:20"]);
    expect(slotStarts("13:00", "13:10")).toEqual([]);
  });

  it("treats touching ranges as not overlapping", () => {
    expect(timesOverlap("13:00", "13:20", "13:20", "13:40")).toBe(false);
    expect(timesOverlap("13:00", "13:20", "13:10", "13:40")).toBe(true);
    expect(timesOverlap("13:00", "13:20", "12:00", "14:00")).toBe(true);
  });

  it("knows the weekday of a date, Monday first", () => {
    expect(weekdayOf("2026-09-07")).toBe(0);
    expect(weekdayOf("2026-09-13")).toBe(6);
  });
});
