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
import { Semester } from "models/semester";
import { Team } from "models/team";
import {
  copyCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  getViewerTeamName,
  importSemesterPlan,
  updateCalendarEvent,
} from "serverActions/calendarEvents";
import { getSemester, saveSemester } from "serverActions/semester";
import { SEMESTER_PLAN_2026 } from "constants/semesterPlan";
import { auth } from "../../auth";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

type Doc = { _id: Types.ObjectId; role: string };
const signInAs = (user: Doc) =>
  (auth as jest.Mock).mockResolvedValue({
    user: { id: user._id.toString(), role: user.role },
  });

const lecture = {
  title: "Intro to CSS",
  category: "lecture" as const,
  startDate: "2026-09-02",
  startTime: "10:00",
  endTime: "12:00",
};

describe("calendar events", () => {
  let teacher: Doc;
  let anna: Doc;
  let bjarni: Doc;
  let cecil: Doc;

  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    teacher = await createDummyUser("teacher");
    anna = await createDummyUser();
    bjarni = await createDummyUser();
    cecil = await createDummyUser();
    // Anna and Bjarni share a team; Cecil is on his own.
    await Team.create({
      project: new Types.ObjectId(),
      name: "Team Rocket",
      members: [anna._id, bjarni._id],
    });
  });

  describe("creating", () => {
    it("publishes a teacher's event to everyone", async () => {
      signInAs(teacher);

      const result = await createCalendarEvent(lecture);

      expect(result.success).toBe(true);
      const stored = await CalendarEvent.findOne().lean<CalendarEventType>();
      expect(stored).toEqual(
        expect.objectContaining({
          title: "Intro to CSS",
          startDate: "2026-09-02",
          endDate: "2026-09-02",
          startTime: "10:00",
          endTime: "12:00",
          visibility: "everyone",
          owner: teacher._id,
        })
      );
    });

    it("keeps a student's event private by default", async () => {
      signInAs(anna);

      await createCalendarEvent({ ...lecture, title: "Study" });

      expect((await CalendarEvent.findOne().lean<CalendarEventType>())?.visibility).toBe("private");
    });

    it("refuses a student's event for everyone", async () => {
      signInAs(anna);

      const result = await createCalendarEvent({
        ...lecture,
        visibility: "everyone",
      });

      expect(result.success).toBe(false);
      expect(await CalendarEvent.countDocuments()).toBe(0);
    });

    it("attaches a team event to the student's team", async () => {
      signInAs(anna);

      const result = await createCalendarEvent({
        ...lecture,
        title: "Team meeting",
        visibility: "team",
      });

      expect(result.success).toBe(true);
      const team = await Team.findOne({ name: "Team Rocket" });
      expect((await CalendarEvent.findOne().lean<CalendarEventType>())?.team?.toString()).toBe(
        team!._id.toString()
      );
      expect(await getViewerTeamName()).toBe("Team Rocket");
    });

    it("refuses a team event from someone without a team", async () => {
      signInAs(cecil);

      const result = await createCalendarEvent({ ...lecture, visibility: "team" });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.message).toMatch(/not on a team/i);
      expect(await getViewerTeamName()).toBeNull();
    });

    it("repeats weekly as one series", async () => {
      signInAs(teacher);

      const result = await createCalendarEvent({
        ...lecture,
        repeatWeeklyUntil: "2026-09-23",
      });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.count).toBe(4);
      const rows = await CalendarEvent.find().sort({ startDate: 1 }).lean<CalendarEventType[]>();
      expect(rows.map((row) => row.startDate)).toEqual([
        "2026-09-02",
        "2026-09-09",
        "2026-09-16",
        "2026-09-23",
      ]);
      expect(new Set(rows.map((row) => row.seriesId)).size).toBe(1);
      expect(rows[0].seriesId).toBeTruthy();
    });

    it("reports field errors", async () => {
      signInAs(teacher);

      const result = await createCalendarEvent({ ...lecture, title: "" });

      expect(result.success).toBe(false);
      if (!result.success) expect(result.errors?.title).toBeDefined();
    });
  });

  describe("reading", () => {
    beforeEach(async () => {
      signInAs(teacher);
      await createCalendarEvent(lecture);
      signInAs(anna);
      await createCalendarEvent({ ...lecture, title: "Anna private" });
      await createCalendarEvent({
        ...lecture,
        title: "Team meeting",
        visibility: "team",
      });
      signInAs(cecil);
      await createCalendarEvent({ ...lecture, title: "Cecil private" });
    });

    it("shows a teacher everything, all editable", async () => {
      signInAs(teacher);

      const events = await getCalendarEvents();

      expect(events.map((event) => event.title).sort()).toEqual([
        "Anna private",
        "Cecil private",
        "Intro to CSS",
        "Team meeting",
      ]);
      expect(events.every((event) => event.canEdit)).toBe(true);
    });

    it("shows a student shared events, their own, and their team's", async () => {
      signInAs(bjarni);

      const events = await getCalendarEvents();

      expect(events.map((event) => event.title).sort()).toEqual([
        "Intro to CSS",
        "Team meeting",
      ]);
      const meeting = events.find((event) => event.title === "Team meeting")!;
      expect(meeting.canEdit).toBe(false);
      expect(meeting.ownerLabel).toBe("Team Rocket");
      expect(meeting.visibility).toBe("team");
      const shared = events.find((event) => event.title === "Intro to CSS")!;
      expect(shared.source).toBe("school");
      expect(shared.canEdit).toBe(false);
    });

    it("marks the viewer's own events editable", async () => {
      signInAs(anna);

      const events = await getCalendarEvents();
      const own = events.find((event) => event.title === "Anna private")!;

      expect(own.canEdit).toBe(true);
      expect(own.ownerLabel).toBe("You");
      expect(events.some((event) => event.title === "Cecil private")).toBe(false);
    });
  });

  describe("editing and deleting", () => {
    it("lets a student change and remove their own event only", async () => {
      signInAs(anna);
      await createCalendarEvent({ ...lecture, title: "Mine" });
      const mine = await CalendarEvent.findOne({ title: "Mine" });
      signInAs(cecil);
      await createCalendarEvent({ ...lecture, title: "Cecil's" });
      const cecils = await CalendarEvent.findOne({ title: "Cecil's" });

      signInAs(anna);
      const denied = await updateCalendarEvent(cecils!._id.toString(), {
        ...lecture,
        title: "Hijacked",
      });
      expect(denied.success).toBe(false);
      expect((await deleteCalendarEvent(cecils!._id.toString())).success).toBe(false);

      const allowed = await updateCalendarEvent(mine!._id.toString(), {
        ...lecture,
        title: "Renamed",
        startTime: "",
        endTime: "",
      });
      expect(allowed.success).toBe(true);
      const updated = await CalendarEvent.findById(mine!._id).lean<CalendarEventType>();
      expect(updated?.title).toBe("Renamed");
      expect(updated?.startTime).toBeUndefined();

      expect((await deleteCalendarEvent(mine!._id.toString())).success).toBe(true);
      expect(await CalendarEvent.countDocuments()).toBe(1);
    });

    it("lets a teacher edit a student's event without changing its audience", async () => {
      signInAs(anna);
      await createCalendarEvent({ ...lecture, title: "Team meeting", visibility: "team" });
      const event = await CalendarEvent.findOne();

      signInAs(teacher);
      const result = await updateCalendarEvent(event!._id.toString(), {
        ...lecture,
        title: "Team meeting (moved)",
      });

      expect(result.success).toBe(true);
      const updated = await CalendarEvent.findById(event!._id).lean<CalendarEventType>();
      expect(updated?.title).toBe("Team meeting (moved)");
      expect(updated?.visibility).toBe("team");
      expect(updated?.team).toBeTruthy();
    });

    it("applies a change to every week of a series but keeps the dates", async () => {
      signInAs(teacher);
      await createCalendarEvent({ ...lecture, repeatWeeklyUntil: "2026-09-16" });
      const second = await CalendarEvent.findOne({ startDate: "2026-09-09" });

      const result = await updateCalendarEvent(
        second!._id.toString(),
        { ...lecture, title: "CSS, part 2", startDate: "2026-10-01" },
        { applyToSeries: true }
      );

      expect(result.success).toBe(true);
      const rows = await CalendarEvent.find().sort({ startDate: 1 }).lean<CalendarEventType[]>();
      expect(rows.map((row) => row.title)).toEqual([
        "CSS, part 2",
        "CSS, part 2",
        "CSS, part 2",
      ]);
      expect(rows.map((row) => row.startDate)).toEqual([
        "2026-09-02",
        "2026-09-09",
        "2026-09-16",
      ]);
    });

    it("deletes one week or the whole series", async () => {
      signInAs(teacher);
      await createCalendarEvent({ ...lecture, repeatWeeklyUntil: "2026-09-16" });
      const [first, second] = await CalendarEvent.find().sort({ startDate: 1 });

      expect((await deleteCalendarEvent(first._id.toString())).success).toBe(true);
      expect(await CalendarEvent.countDocuments()).toBe(2);

      expect(
        (await deleteCalendarEvent(second._id.toString(), { applyToSeries: true }))
          .success
      ).toBe(true);
      expect(await CalendarEvent.countDocuments()).toBe(0);
    });
  });

  describe("filling a term", () => {
    it("imports the built-in plan once, for teachers only", async () => {
      signInAs(anna);
      expect((await importSemesterPlan()).success).toBe(false);

      signInAs(teacher);
      const first = await importSemesterPlan();
      expect(first.success).toBe(true);
      if (first.success) expect(first.data.added).toBe(SEMESTER_PLAN_2026.length);

      const again = await importSemesterPlan();
      if (again.success) expect(again.data.added).toBe(0);
      expect(await CalendarEvent.countDocuments()).toBe(SEMESTER_PLAN_2026.length);
      const imported = await CalendarEvent.findOne({ importKey: /first-day$/ }).lean<CalendarEventType>();
      expect(imported).toEqual(
        expect.objectContaining({
          startDate: "2026-08-17",
          owner: null,
          visibility: "everyone",
        })
      );
    });

    it("copies shared events forward by whole weeks, once", async () => {
      signInAs(teacher);
      await createCalendarEvent({ ...lecture, startDate: "2025-09-03" });
      signInAs(anna);
      await createCalendarEvent({ ...lecture, title: "Not copied", startDate: "2025-09-03" });

      signInAs(teacher);
      const result = await copyCalendarEvents({
        fromDate: "2025-08-18",
        toDate: "2025-12-19",
        weeks: 52,
      });

      expect(result.success).toBe(true);
      if (result.success) expect(result.data.added).toBe(1);
      const copy = await CalendarEvent.findOne({ startDate: "2026-09-02" }).lean<CalendarEventType>();
      expect(copy).toEqual(
        expect.objectContaining({
          title: "Intro to CSS",
          startTime: "10:00",
          owner: null,
          visibility: "everyone",
        })
      );

      const again = await copyCalendarEvents({
        fromDate: "2025-08-18",
        toDate: "2025-12-19",
        weeks: 52,
      });
      if (again.success) expect(again.data.added).toBe(0);
    });
  });

  describe("semester", () => {
    it("falls back to the built-in term until a teacher saves one", async () => {
      signInAs(anna);
      expect((await getSemester()).saved).toBe(false);

      const denied = await saveSemester({
        label: "Spring 2027",
        startDate: "2027-01-05",
        endDate: "2027-05-20",
      });
      expect(denied.success).toBe(false);

      signInAs(teacher);
      const saved = await saveSemester({
        label: "Spring 2027",
        startDate: "2027-01-05",
        endDate: "2027-05-20",
        spann2Start: "2027-03-15",
      });
      expect(saved.success).toBe(true);
      expect(await getSemester()).toEqual({
        label: "Spring 2027",
        startDate: "2027-01-05",
        endDate: "2027-05-20",
        spann2Start: "2027-03-15",
        saved: true,
      });

      // Saving again edits the same term rather than adding another.
      await saveSemester({
        label: "Spring 2027",
        startDate: "2027-01-05",
        endDate: "2027-05-21",
      });
      expect(await Semester.countDocuments()).toBe(1);
      expect((await getSemester()).spann2Start).toBeUndefined();
    });
  });
});
