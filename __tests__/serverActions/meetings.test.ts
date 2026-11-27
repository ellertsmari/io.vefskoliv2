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
import { SignupSheet } from "models/signupSheet";
import { Team } from "models/team";
import {
  bookMeeting,
  deleteBookingWindow,
  getBookingWindows,
  getMeetingSlots,
  getUpcomingMeetings,
  saveBookingWindow,
} from "serverActions/meetings";
import { createCalendarEvent, updateCalendarEvent } from "serverActions/calendarEvents";
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

    it("drops the times a lecture is on, for every teacher", async () => {
      // A third teacher would cover a "not available"; a lecture takes all.
      await createDummyUser("teacher", { name: "Þórdís" });
      signInAs(smari);
      await createCalendarEvent({
        title: "Intro to CSS",
        category: "lecture",
        startDate: nextTuesday,
        startTime: "13:00",
        endTime: "13:30",
      });

      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);

      expect(slots.map((slot) => slot.startTime)).toEqual(["13:40"]);
    });

    it("assumes an hour for a lecture with only a start time", async () => {
      signInAs(smari);
      await createCalendarEvent({
        title: "Intro to CSS",
        category: "lecture",
        startDate: nextTuesday,
        startTime: "12:30",
      });

      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);

      expect(slots.map((slot) => slot.startTime)).toEqual(["13:40"]);
    });

    it("ignores a lecture with no time at all", async () => {
      signInAs(smari);
      await createCalendarEvent({
        title: "Intro to CSS",
        category: "lecture",
        startDate: nextTuesday,
      });

      signInAs(anna);
      expect(await getMeetingSlots(rangeFrom, rangeTo)).toHaveLength(3);
    });

    it("offers nothing on a holiday", async () => {
      signInAs(smari);
      await createCalendarEvent({
        title: "Day off",
        category: "holiday",
        startDate: nextTuesday,
      });

      signInAs(anna);
      expect(await getMeetingSlots(rangeFrom, rangeTo)).toEqual([]);
    });

    it("ignores a student's own event, whatever it is called", async () => {
      // The action refuses this; a stored one still must not block anyone.
      await CalendarEvent.create({
        title: "My lecture",
        category: "lecture",
        startDate: nextTuesday,
        endDate: nextTuesday,
        startTime: "13:00",
        endTime: "14:00",
        owner: anna._id,
        visibility: "private",
      });

      signInAs(anna);
      expect(await getMeetingSlots(rangeFrom, rangeTo)).toHaveLength(3);
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

    it("gives the slot to one of two students who book it at the same moment", async () => {
      const bjarni = await createDummyUser("user", { name: "Bjarni" });
      // Whoever asks is signed in: alternate between the two students.
      (auth as jest.Mock)
        .mockResolvedValueOnce({ user: { id: anna._id.toString(), role: "user", name: "Anna" } })
        .mockResolvedValueOnce({ user: { id: bjarni._id.toString(), role: "user", name: "Bjarni" } });
      const booking = { date: nextTuesday, startTime: "13:20", topic: "Feedback" };

      const results = await Promise.all([bookMeeting(booking), bookMeeting(booking)]);

      expect(results.filter((result) => result.success)).toHaveLength(1);
      expect(await CalendarEvent.countDocuments({ category: "meeting" })).toBe(1);
    });

    it("attaches the free teachers themselves, not everyone with their name", async () => {
      const namesake = await createDummyUser("teacher", { name: "Hanna" });
      signInAs(namesake);
      await createCalendarEvent({
        title: "Away",
        category: "unavailable",
        startDate: nextTuesday,
        visibility: "everyone",
      });
      signInAs(anna);

      await bookMeeting({ date: nextTuesday, startTime: "13:00", topic: "Feedback" });

      const stored = await CalendarEvent.findOne({ category: "meeting" }).lean<CalendarEventType>();
      expect(stored?.sharedWith.map(String).sort()).toEqual(
        [smari._id.toString(), hanna._id.toString()].sort()
      );
    });

    it("lets the student reword a booked meeting but not move or re-share it", async () => {
      signInAs(anna);
      await bookMeeting({ date: nextTuesday, startTime: "13:20", topic: "Feedback" });
      const booked = await CalendarEvent.findOne({ category: "meeting" }).lean<CalendarEventType>();
      const asBooked = {
        title: "Meeting: Anna",
        category: "meeting" as const,
        startDate: nextTuesday,
        startTime: "13:20",
        endTime: "13:40",
        visibility: "shared" as const,
      };

      const moved = await updateCalendarEvent(String(booked!._id), {
        ...asBooked,
        startTime: "18:00",
        endTime: "18:20",
      });
      expect(moved.success).toBe(false);

      const reworded = await updateCalendarEvent(String(booked!._id), {
        ...asBooked,
        description: "Feedback on the second prototype",
        visibility: "private",
      });
      expect(reworded.success).toBe(true);
      const after = await CalendarEvent.findById(booked!._id).lean<CalendarEventType>();
      expect(after).toEqual(
        expect.objectContaining({
          description: "Feedback on the second prototype",
          startTime: "13:20",
          endTime: "13:40",
          visibility: "shared",
        })
      );
      expect(after?.sharedWith.map(String).sort()).toEqual(
        [smari._id.toString(), hanna._id.toString()].sort()
      );
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

    it("shows up on the attending teachers' dashboards, soonest first", async () => {
      const bjarni = await createDummyUser("user", { name: "Bjarni" });
      await Team.create({
        project: new Types.ObjectId(),
        name: "Team Rocket",
        members: [anna._id, bjarni._id],
      });
      signInAs(anna);
      await bookMeeting({ date: nextTuesday, startTime: "13:40", topic: "Later" });
      await bookMeeting({
        date: nextTuesday,
        startTime: "13:00",
        topic: "Team check-in",
        withTeam: true,
      });

      signInAs(smari);
      const mine = await getUpcomingMeetings();

      expect(mine.map((m) => m.startTime)).toEqual(["13:00", "13:40"]);
      expect(mine[0]).toEqual(
        expect.objectContaining({
          date: nextTuesday,
          endTime: "13:20",
          topic: "Team check-in",
          studentName: "Anna",
          withTeachers: ["Hanna"],
          teamName: "Team Rocket",
        })
      );
      expect(mine[1].teamName).toBeUndefined();

      // A teacher who was not free, so not booked, does not see it.
      const other = await createDummyUser("teacher", { name: "Þórdís" });
      signInAs(other);
      expect(await getUpcomingMeetings()).toEqual([]);

      signInAs(anna);
      expect(await getUpcomingMeetings()).toEqual([]);
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

  describe("length and other commitments", () => {
    it("offers meetings of the length the hours were saved with", async () => {
      await BookingWindow.deleteMany({});
      signInAs(smari);
      const saved = await saveBookingWindow({
        weekday: 1,
        startTime: "13:00",
        endTime: "16:00",
        slotMinutes: 90,
        validFrom: todayKey(),
        validTo: addDays(todayKey(), 120),
      });
      expect(saved.success).toBe(true);
      expect((await getBookingWindows())[0].slotMinutes).toBe(90);

      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);
      expect(slots.map((slot) => `${slot.startTime}-${slot.endTime}`)).toEqual([
        "13:00-14:30",
        "14:30-16:00",
      ]);
    });

    it("refuses a length that is not offered", async () => {
      signInAs(smari);
      const result = await saveBookingWindow({
        weekday: 2,
        startTime: "10:00",
        endTime: "12:00",
        slotMinutes: 25,
        validFrom: todayKey(),
        validTo: addDays(todayKey(), 30),
      });
      expect(result.success).toBe(false);
    });

    it("drops times that overlap a meeting a teacher is in, at any start", async () => {
      // E.g. scheduled from a "find a time" poll: not on the 20-minute grid.
      await CalendarEvent.create({
        title: "Staff sync",
        category: "meeting",
        startDate: nextTuesday,
        endDate: nextTuesday,
        startTime: "13:10",
        endTime: "13:30",
        owner: smari._id,
        visibility: "shared",
        sharedWith: [hanna._id],
      });
      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);
      expect(slots.map((slot) => slot.startTime)).toEqual(["13:40"]);
    });

    it("ignores a meeting between students", async () => {
      const bjarni = await createDummyUser("user", { name: "Bjarni" });
      await CalendarEvent.create({
        title: "Study group",
        category: "meeting",
        startDate: nextTuesday,
        endDate: nextTuesday,
        startTime: "13:00",
        endTime: "14:00",
        owner: bjarni._id,
        visibility: "shared",
        sharedWith: [anna._id],
      });
      signInAs(anna);
      expect(await getMeetingSlots(rangeFrom, rangeTo)).toHaveLength(3);
    });

    it("keeps the teacher running a sign-up sheet out of meetings meanwhile", async () => {
      await SignupSheet.create({
        title: "Design review",
        owner: smari._id,
        date: nextTuesday,
        slotMinutes: 20,
        capacity: 1,
        audience: "everyone",
        slots: [
          { startTime: "13:00", endTime: "13:20", claims: [] },
          { startTime: "13:20", endTime: "13:40", claims: [{ user: anna._id }] },
        ],
      });
      signInAs(anna);
      const slots = await getMeetingSlots(rangeFrom, rangeTo);
      expect(slots.map((slot) => slot.startTime)).toEqual(["13:40"]);

      // And the taken slot is on the teacher's dashboard.
      signInAs(smari);
      const upcoming = await getUpcomingMeetings();
      expect(upcoming).toHaveLength(1);
      expect(upcoming[0]).toMatchObject({
        date: nextTuesday,
        startTime: "13:20",
        endTime: "13:40",
        studentName: "Anna",
        topic: "Design review",
      });
    });
  });
});
