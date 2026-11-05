/**
 * @jest-environment node
 */
import { auth } from "../../auth";
import {
  closeDatabase,
  clearDatabase,
  createDummyUser,
  connect,
} from "../__mocks__/mongoHandler";
import { GroupProject, GroupProjectLean } from "models/groupProject";
import { GroupPreference } from "models/groupPreference";
import {
  getBriefBySlug,
  getPublicBriefs,
} from "serverActions/groups/getPublicBriefs";
import { getGroupProject } from "serverActions/groups/getGroupProject";
import { updateGroupProject } from "serverActions/groups/manageGroupProject";
import { UserDocument } from "models/user";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

const loginAs = (user: UserDocument) => {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: user._id.toString(), role: user.role },
  });
};

const loggedOut = () => (auth as jest.Mock).mockResolvedValue(null);

// Module 1's brief lives at /projects/first-website.
const SLUG = "first-website";

const createFormingProject = async (overrides: Record<string, unknown> = {}) => {
  const teacher = await createDummyUser("teacher");
  return GroupProject.create({
    title: "Module 1 project",
    module: 1,
    // far future so the lifecycle does not activate it
    startDate: new Date("2099-01-01"),
    endDate: new Date("2099-02-01"),
    status: "formation",
    createdBy: teacher._id,
    ...overrides,
  });
};

describe("public brief pages", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase(), 10000);
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it("hides a forming project's brief from visitors", async () => {
    await createFormingProject();
    loggedOut();
    expect(await getBriefBySlug(SLUG)).toBeNull();
    expect(await getPublicBriefs()).toEqual([]);
  });

  it("publishes a forming project's brief when a teacher makes it public", async () => {
    const project = await createFormingProject();
    const teacher = await createDummyUser("teacher");
    loginAs(teacher);
    const result = await updateGroupProject({
      projectId: project._id.toString(),
      briefPublic: true,
    });
    expect(result.success).toBe(true);

    loggedOut();
    const brief = await getBriefBySlug(SLUG);
    expect(brief).not.toBeNull();
    expect(brief?.isPreview).toBe(false);
    expect((await getPublicBriefs()).map((b) => b.brief.slug)).toEqual([SLUG]);

    // Formation itself is untouched.
    const stored = await GroupProject.findById(project._id).lean<GroupProjectLean | null>();
    expect(stored?.status).toBe("formation");
  });

  it("keeps the brief locked in the LMS for students who have not answered the form", async () => {
    const project = await createFormingProject({ briefPublic: true });
    const student = await createDummyUser("user");
    loginAs(student);
    const details = await getGroupProject(project._id.toString());
    expect(details).not.toBeNull();
    expect(details?.project.status).toBe("formation");
    expect(details?.project.descriptionLocked).toBe(true);
    expect(details?.project.brief).toBeNull();
    expect(details?.project.briefPublic).toBe(true);
    expect(await GroupPreference.countDocuments()).toBe(0);
  });

  it("is public once the project is past formation, whatever the flag says", async () => {
    await createFormingProject({
      status: "active",
      startDate: new Date("2026-01-01"),
      autoApplied: { activated: true },
    });
    loggedOut();
    expect((await getBriefBySlug(SLUG))?.briefPublic).toBe(true);
  });

  it("does not let a student make a brief public", async () => {
    const project = await createFormingProject();
    const student = await createDummyUser("user");
    loginAs(student);
    const result = await updateGroupProject({
      projectId: project._id.toString(),
      briefPublic: true,
    });
    expect(result.success).toBe(false);
    const stored = await GroupProject.findById(project._id).lean<GroupProjectLean | null>();
    expect(stored?.briefPublic).toBe(false);
  });
});
