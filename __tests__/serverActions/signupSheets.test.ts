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
import { SignupSheet } from "models/signupSheet";
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import {
  addSlot,
  assignSlot,
  claimSlot,
  createSignupSheet,
  deleteSignupSheet,
  getSignupSheets,
  getSignupTargets,
  releaseSlot,
  removeSlot,
} from "serverActions/signupSheets";
import { addDays, todayKey } from "utils/calendarUtils";
import { needsSignUp, sheetCalendarEvents } from "utils/meetingUtils";
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

const nextWeek = addDays(todayKey(), 7);

describe("sign-up sheets", () => {
  let smari: Doc;
  let anna: Doc;
  let bjorn: Doc;
  let dora: Doc;
  let projectId: string;
  let annasTeam: Types.ObjectId;
  let dorasTeam: Types.ObjectId;

  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    smari = await createDummyUser("teacher", { name: "Smári" });
    anna = await createDummyUser("user", { name: "Anna" });
    bjorn = await createDummyUser("user", { name: "Björn" });
    dora = await createDummyUser("user", { name: "Dóra" });
    const project = await GroupProject.create({
      title: "Module 3",
      startDate: new Date(),
      endDate: new Date(),
      status: "active",
      createdBy: smari._id,
    });
    projectId = String(project._id);
    annasTeam = (
      await Team.create({
        project: project._id,
        name: "Kaffistofan",
        members: [anna._id, bjorn._id],
      })
    )._id;
    dorasTeam = (
      await Team.create({ project: project._id, name: "Wanderlust", members: [dora._id] })
    )._id;
  });

  const teamSheet = async () => {
    signInAs(smari);
    const result = await createSignupSheet({
      title: "Design review",
      date: nextWeek,
      slotMinutes: 20,
      slots: ["10:00", "10:20", "10:40"],
      audience: "project",
      projectId,
    });
    if (!result.success) throw new Error(result.message);
    return result.data.id;
  };

  const mySheet = async (id: string) =>
    (await getSignupSheets()).find((sheet) => sheet.id === id);

  describe("creating", () => {
    it("stores each slot with its end time", async () => {
      const id = await teamSheet();
      const stored = await SignupSheet.findById(id).lean<{
        slots: Array<{ startTime: string; endTime: string }>;
      }>();
      expect(stored?.slots.map((slot) => `${slot.startTime}-${slot.endTime}`)).toEqual([
        "10:00-10:20",
        "10:20-10:40",
        "10:40-11:00",
      ]);
    });

    it("lets only teachers make a sheet for a group project's teams", async () => {
      signInAs(anna);
      const result = await createSignupSheet({
        title: "Design review",
        date: nextWeek,
        slotMinutes: 20,
        slots: ["10:00"],
        audience: "project",
        projectId,
      });
      expect(result.success).toBe(false);
      expect(await SignupSheet.countDocuments()).toBe(0);
    });

    it("lets a student organise a meet-up with several places", async () => {
      signInAs(anna);
      const result = await createSignupSheet({
        title: "Pizza and portfolios",
        date: nextWeek,
        slotMinutes: 120,
        capacity: 8,
        slots: ["18:00"],
        audience: "everyone",
      });
      expect(result.success).toBe(true);

      signInAs(bjorn);
      const [sheet] = await getSignupSheets();
      expect(sheet.capacity).toBe(8);
      expect(sheet.slots[0].endTime).toBe("20:00");
      expect(sheet.canSignUp).toBe(true);
      expect(sheet.canManage).toBe(false);
    });

    it("refuses overlapping slots and lengths that are not offered", async () => {
      signInAs(smari);
      const overlapping = await createSignupSheet({
        title: "Review",
        date: nextWeek,
        slotMinutes: 30,
        slots: ["10:00", "10:20"],
        audience: "everyone",
      });
      expect(overlapping.success).toBe(false);
      const oddLength = await createSignupSheet({
        title: "Review",
        date: nextWeek,
        slotMinutes: 25,
        slots: ["10:00"],
        audience: "everyone",
      });
      expect(oddLength.success).toBe(false);
    });
  });

  describe("who sees a sheet", () => {
    it("shows a team sheet to the project's teams and to teachers", async () => {
      const id = await teamSheet();
      const outsider = await createDummyUser("user", { name: "Einar" });

      signInAs(anna);
      const forAnna = await mySheet(id);
      expect(forAnna?.signUpAs).toBe("Kaffistofan");
      expect(forAnna?.audienceLabel).toBe("Teams of Module 3");
      expect(forAnna && needsSignUp(forAnna)).toBe(true);

      signInAs(outsider);
      expect(await getSignupSheets()).toEqual([]);

      signInAs(smari);
      const forSmari = await mySheet(id);
      expect(forSmari?.canManage).toBe(true);
      expect(forSmari?.canSignUp).toBe(false);
      expect(forSmari?.waiting?.map((team) => team.label).sort()).toEqual([
        "Kaffistofan",
        "Wanderlust",
      ]);
    });

    it("keeps a picked-people sheet from everyone else, teachers included", async () => {
      signInAs(anna);
      await createSignupSheet({
        title: "Study group",
        date: nextWeek,
        slotMinutes: 60,
        slots: ["16:00"],
        audience: "shared",
        sharedWith: [bjorn._id.toString()],
      });
      signInAs(bjorn);
      expect(await getSignupSheets()).toHaveLength(1);
      signInAs(dora);
      expect(await getSignupSheets()).toHaveLength(0);
      signInAs(smari);
      expect(await getSignupSheets()).toHaveLength(0);
    });
  });

  describe("taking a slot", () => {
    it("signs the whole team up when one member picks", async () => {
      const id = await teamSheet();
      signInAs(anna);
      expect((await claimSlot(id, "10:20")).success).toBe(true);

      signInAs(bjorn);
      const sheet = await mySheet(id);
      expect(sheet?.mySlot).toBe("10:20");
      expect(sheet?.slots[1].claims[0]).toMatchObject({
        label: "Kaffistofan",
        mine: true,
      });
      expect(sheet?.slots[1].claims[0].members?.sort()).toEqual(["Anna", "Björn"]);
      expect(sheet && needsSignUp(sheet)).toBe(false);
    });

    it("gives a taken slot to nobody else", async () => {
      const id = await teamSheet();
      signInAs(anna);
      await claimSlot(id, "10:00");
      signInAs(dora);
      const second = await claimSlot(id, "10:00");
      expect(second.success).toBe(false);
      expect((await mySheet(id))?.mySlot).toBeUndefined();
    });

    it("moves a team that picks again, so nobody holds two", async () => {
      const id = await teamSheet();
      signInAs(anna);
      await claimSlot(id, "10:00");
      signInAs(bjorn);
      expect((await claimSlot(id, "10:40")).success).toBe(true);

      const sheet = await mySheet(id);
      expect(sheet?.slots.map((slot) => slot.claims.length)).toEqual([0, 0, 1]);
    });

    it("hands out one slot when two teams click it at once", async () => {
      const id = await teamSheet();
      const asUser = (user: Doc) => ({
        user: { id: user._id.toString(), role: user.role, name: user.name },
      });
      // Each call reads its session first, in order.
      (auth as jest.Mock)
        .mockResolvedValueOnce(asUser(anna))
        .mockResolvedValueOnce(asUser(dora));
      const results = await Promise.all([claimSlot(id, "10:00"), claimSlot(id, "10:00")]);
      expect(results.filter((result) => result.success)).toHaveLength(1);

      const stored = await SignupSheet.findById(id).lean<{
        slots: Array<{ claims: unknown[] }>;
      }>();
      expect(stored?.slots[0].claims).toHaveLength(1);
    });

    it("lets a team give its slot back", async () => {
      const id = await teamSheet();
      signInAs(anna);
      await claimSlot(id, "10:00");
      signInAs(bjorn);
      expect((await releaseSlot(id)).success).toBe(true);
      expect((await mySheet(id))?.mySlot).toBeUndefined();
    });

    it("refuses people the sheet is not for", async () => {
      const id = await teamSheet();
      const outsider = await createDummyUser("user", { name: "Einar" });
      signInAs(outsider);
      expect((await claimSlot(id, "10:00")).success).toBe(false);
      signInAs(smari);
      expect((await claimSlot(id, "10:00")).success).toBe(false);
    });

    it("closes a slot once it has started", async () => {
      signInAs(smari);
      const created = await createSignupSheet({
        title: "Earlier today",
        date: todayKey(),
        slotMinutes: 10,
        slots: ["00:00"],
        audience: "everyone",
      });
      const id = created.success ? created.data.id : "";
      signInAs(anna);
      expect((await claimSlot(id, "00:00")).success).toBe(false);
      expect((await mySheet(id))?.slots[0].past).toBe(true);
    });

    it("fills a slot up to its number of places", async () => {
      signInAs(anna);
      const created = await createSignupSheet({
        title: "Meet-up",
        date: nextWeek,
        slotMinutes: 60,
        capacity: 2,
        slots: ["18:00"],
        audience: "everyone",
      });
      const id = created.success ? created.data.id : "";
      signInAs(bjorn);
      expect((await claimSlot(id, "18:00")).success).toBe(true);
      signInAs(dora);
      expect((await claimSlot(id, "18:00")).success).toBe(true);
      signInAs(smari);
      expect((await claimSlot(id, "18:00")).success).toBe(false);
      expect((await mySheet(id))?.slots[0].full).toBe(true);
    });
  });

  describe("running a sheet", () => {
    it("lets a teacher assign, move and clear a team's slot", async () => {
      const id = await teamSheet();
      signInAs(smari);
      expect((await assignSlot(id, String(dorasTeam), "10:00")).success).toBe(true);
      expect((await assignSlot(id, String(dorasTeam), "10:40")).success).toBe(true);
      let sheet = await mySheet(id);
      expect(sheet?.slots.map((slot) => slot.claims.length)).toEqual([0, 0, 1]);
      expect(sheet?.waiting?.map((team) => team.label)).toEqual(["Kaffistofan"]);

      expect((await assignSlot(id, String(dorasTeam), null)).success).toBe(true);
      sheet = await mySheet(id);
      expect(sheet?.waiting).toHaveLength(2);
    });

    it("keeps students from assigning, adding, removing or deleting", async () => {
      const id = await teamSheet();
      signInAs(anna);
      expect((await assignSlot(id, String(annasTeam), "10:00")).success).toBe(false);
      expect((await addSlot(id, "11:00")).success).toBe(false);
      expect((await removeSlot(id, "10:00")).success).toBe(false);
      expect((await deleteSignupSheet(id)).success).toBe(false);
      expect(await SignupSheet.countDocuments()).toBe(1);
    });

    it("adds a slot that fits and removes an empty one", async () => {
      const id = await teamSheet();
      signInAs(smari);
      expect((await addSlot(id, "10:50")).success).toBe(false);
      expect((await addSlot(id, "11:00")).success).toBe(true);
      signInAs(anna);
      await claimSlot(id, "10:00");
      signInAs(smari);
      expect((await removeSlot(id, "10:00")).success).toBe(false);
      expect((await removeSlot(id, "10:20")).success).toBe(true);
      expect((await mySheet(id))?.slots.map((slot) => slot.startTime)).toEqual([
        "10:00",
        "10:40",
        "11:00",
      ]);
    });

    it("deletes the sheet for its owner", async () => {
      const id = await teamSheet();
      signInAs(smari);
      expect((await deleteSignupSheet(id)).success).toBe(true);
      expect(await SignupSheet.countDocuments()).toBe(0);
    });
  });

  describe("what the form offers", () => {
    it("lists projects with teams for teachers and the team for students", async () => {
      await GroupProject.create({
        title: "No teams yet",
        startDate: new Date(),
        endDate: new Date(),
        createdBy: smari._id,
      });
      signInAs(smari);
      expect(await getSignupTargets()).toEqual({
        projects: [{ id: projectId, title: "Module 3", teams: 2 }],
        teamName: null,
      });
      signInAs(anna);
      expect(await getSignupTargets()).toEqual({ projects: [], teamName: "Kaffistofan" });
    });
  });

  describe("on the calendar", () => {
    it("shows a reminder until the team picks, then its own slot", async () => {
      const id = await teamSheet();
      signInAs(anna);
      let events = sheetCalendarEvents(await getSignupSheets());
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: "Sign up: Design review",
        time: "10:00",
        endTime: "11:00",
        tentative: true,
      });

      await claimSlot(id, "10:20");
      events = sheetCalendarEvents(await getSignupSheets());
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        title: "Design review",
        time: "10:20",
        endTime: "10:40",
        meetingRef: { kind: "sheet", id },
      });
    });

    it("shows the running order to whoever runs the sheet", async () => {
      const id = await teamSheet();
      signInAs(anna);
      await claimSlot(id, "10:20");
      signInAs(smari);
      const events = sheetCalendarEvents(await getSignupSheets());
      expect(events).toHaveLength(1);
      expect(events[0].description).toBe("10:20 Kaffistofan");
    });
  });
});
