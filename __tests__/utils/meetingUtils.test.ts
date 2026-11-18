import {
  buildSlots,
  clashOf,
  lengthLabel,
  slotsProblem,
} from "utils/meetingUtils";
import type { CalendarEvent } from "types/calendarTypes";

const event = (overrides: Partial<CalendarEvent>): CalendarEvent => ({
  id: "e",
  date: "2026-11-19",
  title: "Lecture",
  category: "lecture",
  ...overrides,
});

describe("meetingUtils", () => {
  describe("lengthLabel", () => {
    it("reads naturally at every offered length", () => {
      expect([20, 60, 90, 120].map(lengthLabel)).toEqual([
        "20 min",
        "1 hour",
        "1½ hours",
        "2 hours",
      ]);
    });
  });

  describe("buildSlots", () => {
    it("fills a range back to back and drops a slot that would overrun", () => {
      expect(buildSlots("13:00", "14:10", 20).map((slot) => slot.startTime)).toEqual([
        "13:00",
        "13:20",
        "13:40",
      ]);
    });

    it("handles slots longer than an hour", () => {
      expect(buildSlots("09:00", "12:00", 90)).toEqual([
        { startTime: "09:00", endTime: "10:30" },
        { startTime: "10:30", endTime: "12:00" },
      ]);
    });

    it("gives nothing for a range that is too short or backwards", () => {
      expect(buildSlots("13:00", "13:10", 20)).toEqual([]);
      expect(buildSlots("14:00", "13:00", 20)).toEqual([]);
    });
  });

  describe("slotsProblem", () => {
    it("accepts slots that touch and refuses ones that overlap", () => {
      expect(slotsProblem(["10:00", "10:20"], 20)).toBeNull();
      expect(slotsProblem(["10:20", "10:00"], 30)).toMatch(/overlap/);
      expect(slotsProblem([], 20)).toMatch(/at least one/);
      expect(slotsProblem(["23:00"], 120)).toMatch(/midnight/);
    });
  });

  describe("clashOf", () => {
    it("finds a timed event that overlaps", () => {
      const events = [event({ time: "10:00", endTime: "11:30" })];
      expect(clashOf(events, "2026-11-19", "11:00", "11:20")?.title).toBe("Lecture");
      expect(clashOf(events, "2026-11-19", "11:30", "11:50")).toBeNull();
      expect(clashOf(events, "2026-11-20", "11:00", "11:20")).toBeNull();
    });

    it("takes an event with no end time to last an hour", () => {
      const events = [event({ time: "09:30" })];
      expect(clashOf(events, "2026-11-19", "10:20", "10:40")).not.toBeNull();
      expect(clashOf(events, "2026-11-19", "10:30", "10:50")).toBeNull();
    });

    it("counts a holiday all day but not a day-long project bar", () => {
      const holiday = [event({ category: "holiday", title: "Winter break" })];
      const project = [
        event({ category: "groupwork", date: "2026-11-01", endDate: "2026-11-30" }),
      ];
      expect(clashOf(holiday, "2026-11-19", "10:00", "10:20")?.title).toBe("Winter break");
      expect(clashOf(project, "2026-11-19", "10:00", "10:20")).toBeNull();
    });

    it("ignores deadlines, reminders and another teacher's not-available", () => {
      const events = [
        event({ category: "deadline", time: "10:00" }),
        event({ category: "meeting", time: "10:00", tentative: true }),
        event({ category: "unavailable", time: "10:00", endTime: "12:00" }),
      ];
      expect(clashOf(events, "2026-11-19", "10:00", "10:20")).toBeNull();
      const mine = [event({ category: "unavailable", mine: true })];
      expect(clashOf(mine, "2026-11-19", "10:00", "10:20")).not.toBeNull();
    });
  });
});
