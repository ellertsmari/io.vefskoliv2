/**
 * @jest-environment node
 */
import { Types } from "mongoose";
import {
  clearDatabase,
  closeDatabase,
  connect,
  createDummyUser,
} from "../__mocks__/mongoHandler";
import { CalendarEvent, type CalendarEventType } from "models/calendarEvent";
import { BookingWindow } from "models/bookingWindow";
import { Team } from "models/team";
import {
  bookMeeting,
  deleteBookingWindow,
  getBookingWindows,
  getMeetingSlots,
  saveBookingWindow,
} from "serverActions/meetings";
import { createCalendarEvent } from "serverActions/calendarEvents";
import { addDays, todayKey, weekdayOf } from "utils/calendarUtils";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

type Doc = { _id: Types.ObjectId; role: string; name: string };
const signInAs = (user: Doc) =>
  (auth as jest.Mock).mockResolvedValue({
    user: { id: user._id.toString(), role: user.role, name: user.name },
  });

// A Tuesday at least a week away, so "in the past" never interferes.
const nextTuesday = (() => {
  let day = addDays(todayKey(), 7);
  while (weekdayOf(day) !== 1) day = addDays(day, 1);
  return day;
})();
const rangeFrom = addDays(nextTuesday, -1);
const rangeTo = addDays(nextTuesday, 1);

describe("meetings", () => {
  let smari: Doc;
  let hanna: Doc;
  let anna: Doc;

  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    smari = await createDummyUser("teacher", { name: "Smári" });
    hanna = await createDummyUser("teacher", { name: "Hanna" });
    anna = await createDummyUser("user", { name: "Anna" });
    await BookingWindow.create({
      weekday: 1,
      startTime: "13:00",
      endTime: "14:00",
      validFrom: todayKey(),
      validTo: addDays(todayKey(), 120),
    });
  });

  describe("meeting hours", () => {
    it("are managed by teachers only", async () => {
      signInAs(anna);
      const denied = await saveBookingWindow({
        weekday: 2,
        startTime: "10:00",
        endTime: "11:00",
        validFrom: todayKey(),
        validTo: addDays(todayKey(), 30),
      });
      expect(denied.success).toBe(false);

      signInAs(smari);
      const added = await saveBookingWindow({
        weekday: 2,
        startTime: "10:00",
        endTime: "11:00",
        validFrom: todayKey(),
        validTo: addDays(todayKey(), 30),
      });
      expect(added.success).toBe(true);
      expect(await getBookingWindows()).toHaveLength(2);

      if (added.success) {
        expect((await deleteBookingWindow(added.data.id)).success).toBe(true);
      }
      expect(await getBookingWindows()).toHaveLength(1);
    });

    it("rejects a window too short for one meeting", async () => {
      signInAs(smari);
      const result = await saveBookingWindow({
        weekday: 2,
        startTime: "10:00",
        endTime: "10:10",
        validFrom: todayKey(),
        validTo: addDays(todayKey(), 30),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("slots", () => {
    it("offers every 20 minutes of the window while two teachers are free", async () => {
      signInAs(anna);

      const slots = await getMeetingSlots(rangeFrom, rangeTo);

      expect(slots.map((slot) => `${slot.date} ${slot.startTime}`)).toEqual([
        `${nextTuesday} 13:00`,
        `${nextTuesday} 13:20`,
        `${nextTuesday} 13:40`,
      ]);
      expect(slots[0].teachers.sort()).toEqual(["Hanna", "Smári"]);
    });

    it("drops the times one teacher is not available, leaving too few", async () => {
      signInAs(hanna);
      await createCalendarEvent({
        title: "Teaching VEFH",
        category: "unavailable",
        startDate: nextTuesday,
        startTime: "13:00",
        endTime: "13:30",
      });

      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);

      expect(slots.map((slot) => slot.startTime)).toEqual(["13:40"]);
    });

    it("keeps a slot when a third teacher covers for the busy one", async () => {
      await createDummyUser("teacher", { name: "Þórdís" });
      signInAs(hanna);
      await createCalendarEvent({
        title: "Busy all day",
        category: "unavailable",
        startDate: nextTuesday,
      });

      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);

      expect(slots).toHaveLength(3);
      expect(slots[0].teachers.sort()).toEqual(["Smári", "Þórdís"]);
    });

    it("offers nothing when only one teacher exists", async () => {
      await createDummyUser("user");
      const { User } = await import("models/user");
      await User.deleteOne({ _id: hanna._id });
      signInAs(anna);

      expect(await getMeetingSlots(rangeFrom, rangeTo)).toEqual([]);
    });

    it("refuses 'not available' from a student", async () => {
      signInAs(anna);
      const result = await createCalendarEvent({
        title: "Nope",
        category: "unavailable",
        startDate: nextTuesday,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("booking", () => {
    it("books a slot shared with both teachers and takes it off the list", async () => {
      signInAs(anna);

      const result = await bookMeeting({
        date: nextTuesday,
        startTime: "13:20",
        topic: "Feedback on our prototype",
      });

      expect(result.success).toBe(true);
      const stored = await CalendarEvent.findOne({ category: "meeting" }).lean<CalendarEventType>();
      expect(stored).toEqual(
        expect.objectContaining({
          title: "Meeting: Anna",
          description: "Feedback on our prototype",
          startDate: nextTuesday,
          startTime: "13:20",
          endTime: "13:40",
          visibility: "shared",
          owner: anna._id,
        })
      );
      expect(stored?.sharedWith.map(String).sort()).toEqual(
        [smari._id.toString(), hanna._id.toString()].sort()
      );

      const slots = await getMeetingSlots(rangeFrom, rangeTo);
      expect(slots.map((slot) => slot.startTime)).toEqual(["13:00", "13:40"]);
    });

    it("includes the team when asked", async () => {
      const bjarni = await createDummyUser("user", { name: "Bjarni" });
      await Team.create({
        project: new Types.ObjectId(),
        name: "Team Rocket",
        members: [anna._id, bjarni._id],
      });
      signInAs(anna);

      await bookMeeting({
        date: nextTuesday,
        startTime: "13:00",
        topic: "Team check-in",
        withTeam: true,
      });

      const stored = await CalendarEvent.findOne({ category: "meeting" }).lean<CalendarEventType>();
      expect(stored?.sharedWith.map(String)).toContain(bjarni._id.toString());
    });

    it("refuses a time that is not offered", async () => {
      signInAs(anna);

      const outside = await bookMeeting({
        date: nextTuesday,
        startTime: "15:00",
        topic: "Anything",
      });
      expect(outside.success).toBe(false);

      await bookMeeting({ date: nextTuesday, startTime: "13:00", topic: "First" });
      const taken = await bookMeeting({
        date: nextTuesday,
        startTime: "13:00",
        topic: "Second",
      });
      expect(taken.success).toBe(false);
      expect(await CalendarEvent.countDocuments({ category: "meeting" })).toBe(1);
    });

    it("cannot be done by a teacher, nor by hand as an event", async () => {
      signInAs(smari);
      const booked = await bookMeeting({
        date: nextTuesday,
        startTime: "13:00",
        topic: "Anything",
      });
      expect(booked.success).toBe(false);

      signInAs(anna);
      const byHand = await createCalendarEvent({
        title: "Meeting",
        category: "meeting",
        startDate: nextTuesday,
      });
      expect(byHand.success).toBe(false);
    });
  });
});
