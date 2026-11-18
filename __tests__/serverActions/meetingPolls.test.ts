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
import { MeetingPoll } from "models/meetingPoll";
import { CalendarEvent } from "models/calendarEvent";
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import {
  createMeetingPoll,
  deleteMeetingPoll,
  getMeetingPolls,
  savePollAvailability,
  schedulePoll,
} from "serverActions/meetingPolls";
import { getCalendarEvents } from "serverActions/calendarEvents";
import { addDays, todayKey } from "utils/calendarUtils";
import { pollOptions } from "utils/meetingUtils";
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

const day1 = addDays(todayKey(), 3);
const day2 = addDays(todayKey(), 4);

describe("find a time", () => {
  let smari: Doc;
  let anna: Doc;
  let bjorn: Doc;
  let dora: Doc;

  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
    smari = await createDummyUser("teacher", { name: "Smári" });
    anna = await createDummyUser("user", { name: "Anna" });
    bjorn = await createDummyUser("user", { name: "Björn" });
    dora = await createDummyUser("user", { name: "Dóra" });
  });

  const annasPoll = async () => {
    signInAs(anna);
    const result = await createMeetingPoll({
      title: "Plan the demo",
      days: [day2, day1],
      dayStart: "10:00",
      dayEnd: "12:00",
      lengthMinutes: 60,
      audience: "shared",
      sharedWith: [bjorn._id.toString()],
    });
    if (!result.success) throw new Error(result.message);
    return result.data.id;
  };

  it("is seen by the owner and whoever was asked, nobody else", async () => {
    await annasPoll();
    signInAs(bjorn);
    const [poll] = await getMeetingPolls();
    expect(poll).toMatchObject({
      title: "Plan the demo",
      days: [day1, day2],
      audienceLabel: "Björn",
      canManage: false,
      answered: false,
      invited: 2,
    });
    signInAs(dora);
    expect(await getMeetingPolls()).toEqual([]);
    signInAs(smari);
    expect(await getMeetingPolls()).toEqual([]);
  });

  it("asks the whole team when it is for my team", async () => {
    const project = await GroupProject.create({
      title: "Module 3",
      startDate: new Date(),
      endDate: new Date(),
      status: "active",
      createdBy: smari._id,
    });
    await Team.create({
      project: project._id,
      name: "Kaffistofan",
      members: [anna._id, bjorn._id],
    });
    signInAs(anna);
    await createMeetingPoll({
      title: "Stand-up",
      days: [day1],
      dayStart: "09:00",
      dayEnd: "10:00",
      lengthMinutes: 15,
      audience: "team",
    });
    signInAs(bjorn);
    expect((await getMeetingPolls())[0]).toMatchObject({
      audienceLabel: "Kaffistofan",
      invited: 2,
    });
    signInAs(dora);
    expect(await getMeetingPolls()).toEqual([]);
  });

  it("refuses hours with no room for the meeting and days in the past", async () => {
    signInAs(anna);
    const tooShort = await createMeetingPoll({
      title: "x",
      days: [day1],
      dayStart: "10:00",
      dayEnd: "10:30",
      lengthMinutes: 60,
      audience: "everyone",
    });
    expect(tooShort.success).toBe(false);
    const past = await createMeetingPoll({
      title: "x",
      days: [addDays(todayKey(), -2)],
      dayStart: "10:00",
      dayEnd: "12:00",
      lengthMinutes: 60,
      audience: "everyone",
    });
    expect(past.success).toBe(false);
  });

  it("keeps one answer per person and drops cells the poll does not ask about", async () => {
    const id = await annasPoll();
    signInAs(bjorn);
    await savePollAvailability(id, [`${day1} 10:00`, `${day1} 08:00`, "nonsense"]);
    await savePollAvailability(id, [`${day1} 10:00`, `${day1} 10:30`]);
    const [poll] = await getMeetingPolls();
    expect(poll.answered).toBe(true);
    expect(poll.responses).toHaveLength(1);
    expect(poll.responses[0]).toMatchObject({
      name: "Björn",
      mine: true,
      cells: [`${day1} 10:00`, `${day1} 10:30`],
    });
  });

  it("keeps people who were not asked from answering", async () => {
    const id = await annasPoll();
    signInAs(dora);
    expect((await savePollAvailability(id, [`${day1} 10:00`])).success).toBe(false);
  });

  it("ranks the times most people can make first", async () => {
    const id = await annasPoll();
    signInAs(anna);
    await savePollAvailability(id, [
      `${day1} 10:00`,
      `${day1} 10:30`,
      `${day2} 11:00`,
      `${day2} 11:30`,
    ]);
    signInAs(bjorn);
    await savePollAvailability(id, [`${day2} 11:00`, `${day2} 11:30`]);

    const [poll] = await getMeetingPolls();
    const options = pollOptions(poll);
    expect(options[0]).toMatchObject({
      date: day2,
      startTime: "11:00",
      endTime: "12:00",
      free: ["Anna", "Björn"],
      busy: [],
    });
    expect(options[1]).toMatchObject({
      date: day1,
      startTime: "10:00",
      free: ["Anna"],
      busy: ["Björn"],
    });
    // 10:30 on day 1 would need 11:00 too, which nobody marked.
    expect(options).toHaveLength(2);
  });

  it("puts the meeting on everyone's calendar and removes the poll", async () => {
    const id = await annasPoll();
    signInAs(bjorn);
    expect((await schedulePoll(id, day2, "11:00")).success).toBe(false);

    signInAs(anna);
    expect((await schedulePoll(id, day2, "11:30")).success).toBe(false);
    expect((await schedulePoll(id, day2, "11:00")).success).toBe(true);
    expect(await MeetingPoll.countDocuments()).toBe(0);
    expect(await CalendarEvent.countDocuments()).toBe(1);

    signInAs(bjorn);
    const [event] = await getCalendarEvents();
    expect(event).toMatchObject({
      title: "Plan the demo",
      category: "meeting",
      date: day2,
      time: "11:00",
      endTime: "12:00",
    });
    signInAs(dora);
    expect(await getCalendarEvents()).toEqual([]);
  });

  it("lets only whoever runs it delete the poll", async () => {
    const id = await annasPoll();
    signInAs(bjorn);
    expect((await deleteMeetingPoll(id)).success).toBe(false);
    signInAs(anna);
    expect((await deleteMeetingPoll(id)).success).toBe(true);
    expect(await MeetingPoll.countDocuments()).toBe(0);
  });

  it("drops a poll from the list once its last day has passed", async () => {
    await MeetingPoll.create({
      title: "Old",
      owner: anna._id,
      days: [addDays(todayKey(), -3)],
      dayStart: "10:00",
      dayEnd: "12:00",
      lengthMinutes: 30,
      audience: "everyone",
    });
    signInAs(anna);
    expect(await getMeetingPolls()).toEqual([]);
  });
});
