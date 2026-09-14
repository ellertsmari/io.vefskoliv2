/** @jest-environment node */
import { Types } from "mongoose";
import { auth } from "../../auth";
import { clearDatabase, closeDatabase, connect, createDummyGuide, createDummyUser } from "../__mocks__/mongoHandler";
import { Guide } from "models/guide";
import { ActivityCycleModel } from "models/activityCycle";
import { ActivityEntryModel } from "models/activityEntry";
import { getActivityLog, saveActivityCycle, saveActivityEntry, reviewActivityEntries, deleteActivityEntry } from "serverActions/activityLog";
import { getGuides } from "serverActions/getGuides";
import { GET } from "app/api/activity-images/[activityId]/[imageId]/route";
import type { ActivityEntryInput } from "types/activityLogTypes";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
const settings = { label: "2025–2026", activityCapMinutes: 600, periods: [
  { id: "autumn", label: "Autumn", startDate: "2025-08-01", endDate: "2025-12-31", targetMinutes: 900 },
  { id: "spring", label: "Spring", startDate: "2026-01-01", endDate: "2026-07-31", targetMinutes: 900 },
] };
const image = "data:image/jpeg;base64,/9j/2Q==";
type Person = { _id: Types.ObjectId; role: string; name?: string };
const login = (p: Person) => (auth as jest.Mock).mockResolvedValue({ user: { id: String(p._id), role: p.role, name: p.name } });

describe("activity log access and lifecycle", () => {
  let teacher: Person; let anna: Person; let bjarni: Person; let guideId: string; let cycleId: string;
  const input = (patch: Partial<ActivityEntryInput> = {}): ActivityEntryInput => ({ guideId, cycleId, name: "Web meetup", location: "Reykjavík", description: "Helped organise the meetup and discussed accessible forms.", sessions: [{ date: "2025-11-20", minutes: 720 }], images: [{ data: image }], links: [], status: "pending", ...patch });
  beforeAll(async () => { await connect(); await ActivityEntryModel.init(); });
  afterAll(closeDatabase);
  beforeEach(async () => {
    await clearDatabase(); jest.clearAllMocks();
    teacher = await createDummyUser("teacher"); anna = await createDummyUser(); bjarni = await createDummyUser();
    const guide = await createDummyGuide(); guideId = String(guide._id);
    await Guide.updateOne({ _id: guideId }, { $set: { submissionType: "activityLog" } });
    login(teacher); expect((await saveActivityCycle(guideId, settings)).success).toBe(true);
    cycleId = String((await ActivityCycleModel.findOne())!._id); login(anna);
  });
  it("saves private evidence, requires teacher approval and caps credit", async () => {
    expect((await saveActivityEntry(input())).success).toBe(true);
    const stored = await ActivityEntryModel.findOne().lean<{ images?: unknown }>();
    expect(stored!.images).toBeUndefined();
    const result = await getActivityLog(guideId);
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.message);
    expect(result.data.students).toHaveLength(1);
    expect(result.data.students[0].progress.creditedMinutes).toBe(0);
    expect(JSON.stringify(result.data)).not.toContain("/9j/");
    const activity = result.data.students[0].entries[0];
    login(teacher);
    expect((await reviewActivityEntries(guideId, cycleId, [{ id: activity.id, revision: 0 }], "approved")).success).toBe(true);
    const reviewed = await getActivityLog(guideId);
    if (!reviewed.success) throw new Error(reviewed.message);
    expect(reviewed.data.students).toHaveLength(2);
    expect(reviewed.data.students.find((s) => s.id === String(anna._id))!.progress.eligibleMinutes).toBe(600);
    const cards = await getGuides(String(anna._id));
    expect(cards?.find((g) => String(g._id) === guideId)?.activityProgress?.eligibleMinutes).toBe(600);
  });
  it("cannot read, edit, delete or reuse another student's evidence", async () => {
    await saveActivityEntry(input());
    const stored = await ActivityEntryModel.findOne();
    login(bjarni);
    const other = await getActivityLog(guideId);
    expect(other.success && other.data.students[0].entries).toEqual([]);
    expect((await saveActivityEntry(input({ id: String(stored!._id), revision: 0 }))).success).toBe(false);
    expect((await deleteActivityEntry(guideId, String(stored!._id), 0)).success).toBe(false);
    expect((await saveActivityEntry(input({ images: [{ id: stored!.imageIds[0] }] }))).success).toBe(false);
    const params = { params: Promise.resolve({ activityId: String(stored!._id), imageId: stored!.imageIds[0] }) };
    expect((await GET(new Request("http://localhost"), params)).status).toBe(404);
    login(anna);
    const own = await GET(new Request("http://localhost"), params);
    expect(own.status).toBe(200); expect(own.headers.get("cache-control")).toBe("private, no-store");
    login(teacher); expect((await GET(new Request("http://localhost"), params)).status).toBe(200);
    (auth as jest.Mock).mockResolvedValue(null);
    expect((await GET(new Request("http://localhost"), params)).status).toBe(401);
  });
  it("prevents students approving their own work or configuring the course", async () => {
    await saveActivityEntry(input()); const row = await ActivityEntryModel.findOne();
    expect((await reviewActivityEntries(guideId, cycleId, [{ id: String(row!._id), revision: 0 }], "approved")).success).toBe(false);
    expect((await saveActivityCycle(guideId, settings)).success).toBe(false);
    login(teacher); expect((await saveActivityEntry(input())).success).toBe(false);
  });
  it("uses student scope while a teacher is viewing as that student", async () => {
    await saveActivityEntry(input());
    (auth as jest.Mock).mockResolvedValue({ user: { id: String(bjarni._id), role: "user", isAliased: true, originalUser: { id: String(teacher._id), role: "teacher" } } });
    const result = await getActivityLog(guideId);
    expect(result.success && result.data.teacher).toBe(false);
    expect(result.success && result.data.students[0].entries).toEqual([]);
    expect((await saveActivityCycle(guideId, settings)).success).toBe(false);
  });
  it("preserves activity identity, rejects duplicate names, and resets approval after editing", async () => {
    await saveActivityEntry(input());
    expect((await saveActivityEntry(input({ name: "  WEB   MEETUP " }))).success).toBe(false);
    const row = await ActivityEntryModel.findOne(); const id = String(row!._id);
    login(teacher); await reviewActivityEntries(guideId, cycleId, [{ id, revision: 0 }], "approved");
    login(anna);
    expect((await saveActivityEntry(input({ id, revision: 0 }))).success).toBe(false);
    expect((await saveActivityEntry(input({ id, revision: 1, sessions: [{ date: "2025-11-20", minutes: 720 }, { date: "2026-02-10", minutes: 120 }], images: [{ id: row!.imageIds[0] }] }))).success).toBe(true);
    const edited = await ActivityEntryModel.findById(id);
    expect(edited!.status).toBe("pending"); expect(edited!.revision).toBe(2);
    expect(await ActivityEntryModel.countDocuments()).toBe(1);
  });
  it("protects reviews from concurrent edits and requires actionable feedback", async () => {
    await saveActivityEntry(input()); const row = await ActivityEntryModel.findOne(); const id = String(row!._id);
    await saveActivityEntry(input({ id, revision: 0 }));
    login(teacher);
    expect((await reviewActivityEntries(guideId, cycleId, [{ id, revision: 0 }], "approved")).success).toBe(false);
    expect((await reviewActivityEntries(guideId, cycleId, [{ id, revision: 1 }], "changesRequested")).success).toBe(false);
    expect((await reviewActivityEntries(guideId, cycleId, [{ id, revision: 1 }], "changesRequested", "Please explain your contribution.")).success).toBe(true);
    expect((await ActivityEntryModel.findById(id))!.teacherComment).toMatch(/contribution/);
  });
  it("validates evidence, dates, durations and reporting-year membership", async () => {
    for (const patch of [{ images: [] }, { description: "" }, { sessions: [{ date: "2024-10-01", minutes: 60 }] }, { sessions: [{ date: "2099-10-01", minutes: 60 }] }, { sessions: [{ date: "2025-11-01", minutes: -60 }] }, { cycleId: String(new Types.ObjectId()) }, { images: [{ data: "data:image/svg+xml;base64,ABC" }] }]) {
      expect((await saveActivityEntry(input(patch))).success).toBe(false);
    }
    expect((await saveActivityEntry(input({ images: [], location: "", description: "", status: "draft" }))).success).toBe(true);
  });
  it("locks used cycle rules and isolates different years", async () => {
    await saveActivityEntry(input()); login(teacher);
    expect((await saveActivityCycle(guideId, { ...settings, activityCapMinutes: 900 }, cycleId)).success).toBe(false);
    expect((await saveActivityCycle(guideId, settings)).success).toBe(false);
    const future = { ...settings, label: "2026–2027", periods: settings.periods.map((p) => ({ ...p, startDate: `${Number(p.startDate.slice(0,4)) + 1}${p.startDate.slice(4)}`, endDate: `${Number(p.endDate.slice(0,4)) + 1}${p.endDate.slice(4)}` })) };
    expect((await saveActivityCycle(guideId, future)).success).toBe(true);
    login(anna); const current = await getActivityLog(guideId);
    expect(current.success && current.data.students[0].entries.length).toBe(0);
    const old = await getActivityLog(guideId, cycleId);
    expect(old.success && old.data.students[0].entries.length).toBe(1);
  });
});
