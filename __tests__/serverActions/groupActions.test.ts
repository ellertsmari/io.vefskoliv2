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
import { GroupProject } from "models/groupProject";
import { Team } from "models/team";
import { GroupPreference } from "models/groupPreference";
import { PeerEvaluation } from "models/peerEvaluation";
import { createGroupProject } from "serverActions/groups/manageGroupProject";
import { saveAssignments, createTeam, deleteTeam } from "serverActions/groups/manageTeams";
import { savePreferences } from "serverActions/groups/savePreferences";
import { getGroupProjects } from "serverActions/groups/getGroupProjects";
import { getGroupProject } from "serverActions/groups/getGroupProject";
import { updateTeamHub } from "serverActions/groups/updateTeamHub";
import { submitPeerEvaluations } from "serverActions/groups/submitPeerEvaluations";
import { submitTeamEvaluation } from "serverActions/groups/submitTeamEvaluation";
import { dueLifecycleUpdates } from "serverActions/groups/lifecycle";
import {
  createJudgeInvitation,
  deleteJudgeInvitation,
} from "serverActions/groups/manageJudges";
import { submitJudgeEvaluation } from "serverActions/groups/judgeActions";
import { JudgeInvitation } from "models/judgeInvitation";
import { TeamEvaluation } from "models/teamEvaluation";
import { UserDocument } from "models/user";

jest.mock("../../auth", () => ({
  auth: jest.fn(),
}));

jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

const loginAs = (user: UserDocument, role: string = user.role) => {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: user._id.toString(), role },
  });
};

// savePreferences requires every question to be answered, so tests that care
// about something else start from a complete set and override one field.
const completePrefs = (overrides: Record<string, unknown> = {}) => ({
  ambition: "Basics" as const,
  focus: ["Frontend" as const],
  techStack: ["HTML" as const],
  schedule: "Daytime only" as const,
  location: "At school" as const,
  about: "",
  ...overrides,
});

const createProject = async (
  overrides: Record<string, unknown> = {},
  creator?: UserDocument
) => {
  const teacher = creator ?? (await createDummyUser("teacher"));
  return GroupProject.create({
    title: "Test Project",
    // far future so formation projects are not auto-activated by the lifecycle
    startDate: new Date("2099-01-01"),
    endDate: new Date("2099-02-01"),
    status: "formation",
    createdBy: teacher._id,
    ...overrides,
  });
};

// A complete submission against the default rubric (product/presentation/qa).
const defaultRubricEntries = (comment = "Solid work") => [
  { category: "product", score: 8, comment },
  { category: "presentation", score: 7, comment: "" },
  { category: "qa", score: 6, comment: "" },
];

describe("group work server actions", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase(), 10000);
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  describe("createGroupProject", () => {
    it("lets a teacher create a project", async () => {
      const teacher = await createDummyUser("teacher");
      loginAs(teacher);

      const result = await createGroupProject({
        title: "Design Sprint",
        description: "A one-week sprint",
        startDate: "2026-09-01",
        endDate: "2026-09-08",
      });

      expect(result.success).toBe(true);
      const project = await GroupProject.findOne({ title: "Design Sprint" });
      expect(project).not.toBeNull();
      expect(project.status).toBe("formation");
    });

    it("rejects students", async () => {
      const student = await createDummyUser("user");
      loginAs(student);

      const result = await createGroupProject({
        title: "Nope",
        description: "",
        startDate: "2026-09-01",
        endDate: "2026-09-08",
      });

      expect(result.success).toBe(false);
    });

    it("rejects an end date before the start date", async () => {
      const teacher = await createDummyUser("teacher");
      loginAs(teacher);

      const result = await createGroupProject({
        title: "Backwards",
        description: "",
        startDate: "2026-09-08",
        endDate: "2026-09-01",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("saveAssignments", () => {
    it("moves students between teams in one batch", async () => {
      const teacher = await createDummyUser("teacher");
      const studentA = await createDummyUser("user");
      const studentB = await createDummyUser("user");
      const project = await createProject({}, teacher);
      const teamOne = await Team.create({ project: project._id, name: "One" });
      const teamTwo = await Team.create({
        project: project._id,
        name: "Two",
        members: [studentB._id],
      });
      loginAs(teacher);

      const result = await saveAssignments({
        projectId: project._id.toString(),
        changes: [
          { userId: studentA._id.toString(), teamId: teamOne._id.toString() },
          { userId: studentB._id.toString(), teamId: teamOne._id.toString() },
        ],
      });

      expect(result.success).toBe(true);
      const one = await Team.findById(teamOne._id);
      const two = await Team.findById(teamTwo._id);
      expect(one.members).toHaveLength(2);
      expect(two.members).toHaveLength(0);
    });

    it("rejects teams from another project", async () => {
      const teacher = await createDummyUser("teacher");
      const student = await createDummyUser("user");
      const project = await createProject({}, teacher);
      const otherProject = await createProject({ title: "Other" }, teacher);
      const foreignTeam = await Team.create({
        project: otherProject._id,
        name: "Foreign",
      });
      loginAs(teacher);

      const result = await saveAssignments({
        projectId: project._id.toString(),
        changes: [
          {
            userId: student._id.toString(),
            teamId: foreignTeam._id.toString(),
          },
        ],
      });

      expect(result.success).toBe(false);
    });

    it("rejects students", async () => {
      const student = await createDummyUser("user");
      const project = await createProject();
      loginAs(student);

      const result = await saveAssignments({
        projectId: project._id.toString(),
        changes: [{ userId: student._id.toString(), teamId: null }],
      });

      expect(result.success).toBe(false);
    });
  });

  describe("createTeam / deleteTeam", () => {
    it("creates a team with a default name and refuses to delete non-empty teams", async () => {
      const teacher = await createDummyUser("teacher");
      const student = await createDummyUser("user");
      const project = await createProject({}, teacher);
      loginAs(teacher);

      const created = await createTeam({ projectId: project._id.toString() });
      expect(created.success).toBe(true);

      const team = await Team.findOne({ project: project._id });
      expect(team.name).toBe("Team 1");

      team.members.push(student._id);
      await team.save();

      const deleted = await deleteTeam({ teamId: team._id.toString() });
      expect(deleted.success).toBe(false);

      team.members = [];
      await team.save();
      const deletedEmpty = await deleteTeam({ teamId: team._id.toString() });
      expect(deletedEmpty.success).toBe(true);
    });
  });

  describe("savePreferences", () => {
    it("upserts preferences during formation", async () => {
      const student = await createDummyUser("user");
      const project = await createProject();
      loginAs(student);

      const first = await savePreferences({
        projectId: project._id.toString(),
        ...completePrefs({
          ambition: "Ambitious",
          techStack: ["React"],
          about: "I love CSS",
        }),
      });
      expect(first.success).toBe(true);

      const second = await savePreferences({
        projectId: project._id.toString(),
        ...completePrefs({
          focus: ["Design"],
          schedule: "Evenings only",
          location: "At home",
        }),
      });
      expect(second.success).toBe(true);

      const prefs = await GroupPreference.find({ project: project._id });
      expect(prefs).toHaveLength(1);
      expect(prefs[0].ambition).toBe("Basics");
      expect(prefs[0].schedule).toBe("Evenings only");
      expect(prefs[0].location).toBe("At home");
    });

    it("rejects a half-filled form so the brief stays locked", async () => {
      const student = await createDummyUser("user");
      const project = await createProject();
      loginAs(student);

      for (const missing of [
        { ambition: "" },
        { focus: [] },
        { techStack: [] },
        { schedule: "" },
        { location: "" },
      ]) {
        const result = await savePreferences({
          projectId: project._id.toString(),
          ...completePrefs(missing),
        });
        expect(result.success).toBe(false);
      }

      expect(await GroupPreference.countDocuments({})).toBe(0);
    });

    it("only accepts preferences for the next upcoming project", async () => {
      const teacher = await createDummyUser("teacher");
      const student = await createDummyUser("user");
      const next = await createProject({ title: "Next" }, teacher);
      const later = await createProject(
        {
          title: "Later",
          startDate: new Date("2099-06-01"),
          endDate: new Date("2099-07-01"),
        },
        teacher
      );
      loginAs(student);

      const rejected = await savePreferences({
        projectId: later._id.toString(),
        ...completePrefs(),
      });
      expect(rejected.success).toBe(false);

      const accepted = await savePreferences({
        projectId: next._id.toString(),
        ...completePrefs(),
      });
      expect(accepted.success).toBe(true);
    });

    it("students see only the next forming project in the list, teachers see all", async () => {
      const teacher = await createDummyUser("teacher");
      const student = await createDummyUser("user");
      await createProject({ title: "Next" }, teacher);
      await createProject(
        {
          title: "Later",
          startDate: new Date("2099-06-01"),
          endDate: new Date("2099-07-01"),
        },
        teacher
      );
      await createProject({ title: "Running", status: "active" }, teacher);

      loginAs(student);
      const studentList = await getGroupProjects();
      expect(studentList.map((p) => p.title).sort()).toEqual([
        "Next",
        "Running",
      ]);

      loginAs(teacher);
      const teacherList = await getGroupProjects();
      expect(teacherList).toHaveLength(3);
    });

    it("withholds the project brief from students until the form is filled in", async () => {
      const teacher = await createDummyUser("teacher");
      const student = await createDummyUser("user");
      const project = await createProject(
        { description: "Build a sustainable island" },
        teacher
      );
      const projectId = project._id.toString();

      loginAs(student);
      const before = await getGroupProject(projectId);
      expect(before?.project.description).toBe("");
      expect(before?.project.descriptionLocked).toBe(true);

      // ...and not in the list payload either
      const listBefore = await getGroupProjects();
      expect(listBefore[0].description).toBe("");
      expect(listBefore[0].hasPreferences).toBe(false);

      await savePreferences({ projectId, ...completePrefs() });

      const after = await getGroupProject(projectId);
      expect(after?.project.description).toBe("Build a sustainable island");
      expect(after?.project.descriptionLocked).toBe(false);
      expect((await getGroupProjects())[0].hasPreferences).toBe(true);

      // teachers are never gated
      loginAs(teacher);
      const asTeacher = await getGroupProject(projectId);
      expect(asTeacher?.project.description).toBe("Build a sustainable island");
    });

    it("opens the brief to everyone once formation is over", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({
        status: "active",
        description: "Build a sustainable island",
      });
      loginAs(student);

      const details = await getGroupProject(project._id.toString());
      expect(details?.project.description).toBe("Build a sustainable island");
      expect(details?.project.descriptionLocked).toBe(false);
    });

    it("rejects changes once the project is active", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ status: "active" });
      loginAs(student);

      const result = await savePreferences({
        projectId: project._id.toString(),
        ...completePrefs(),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTeamHub", () => {
    const hubData = (teamId: string) => ({
      teamId,
      name: "Renamed Team",
      projectName: "Cool App",
      tagline: "The coolest of apps",
      projectDescription: "An app",
      links: {
        github: "https://github.com/team",
        figma: "",
        figjam: "",
        website: "",
        backend: "",
      },
      coverImage: "data:image/jpeg;base64,AAAA",
      teamPhoto: "https://example.com/a.png",
      logo: "",
    });

    it("lets a member edit their team hub", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ status: "active" });
      const team = await Team.create({
        project: project._id,
        name: "Old name",
        members: [student._id],
      });
      loginAs(student);

      const result = await updateTeamHub(hubData(team._id.toString()));
      expect(result.success).toBe(true);

      const updated = await Team.findById(team._id);
      expect(updated.name).toBe("Renamed Team");
      expect(updated.tagline).toBe("The coolest of apps");
      expect(updated.coverImage).toBe("data:image/jpeg;base64,AAAA");
      // legacy pasted URLs are still accepted
      expect(updated.teamPhoto).toBe("https://example.com/a.png");
    });

    it("rejects images that could break out of a CSS url() or href", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ status: "active" });
      const team = await Team.create({
        project: project._id,
        name: "Team",
        members: [student._id],
      });
      loginAs(student);

      // CSS-injection payload that passes a start-anchored-only check
      const payloads = [
        'https://a.png"); } body { background: url("//evil.example/x',
        "data:image/jpeg;base64,AAA</style><script>alert(1)</script>",
        "https://a.png') url(javascript:alert(1))",
      ];
      for (const coverImage of payloads) {
        const result = await updateTeamHub({
          ...hubData(team._id.toString()),
          coverImage,
        });
        expect(result.success).toBe(false);
      }

      const untouched = await Team.findById(team._id);
      expect(untouched.coverImage).toBeFalsy();
    });

    it("rejects non-members and archived projects", async () => {
      const member = await createDummyUser("user");
      const outsider = await createDummyUser("user");
      const project = await createProject({ status: "active" });
      const team = await Team.create({
        project: project._id,
        name: "Team",
        members: [member._id],
      });

      loginAs(outsider);
      const denied = await updateTeamHub(hubData(team._id.toString()));
      expect(denied.success).toBe(false);

      await GroupProject.updateOne(
        { _id: project._id },
        { status: "archived" }
      );
      loginAs(member);
      const archived = await updateTeamHub(hubData(team._id.toString()));
      expect(archived.success).toBe(false);
    });
  });

  describe("submitPeerEvaluations", () => {
    const setupTeam = async (peerEvalOpen = true) => {
      const studentA = await createDummyUser("user");
      const studentB = await createDummyUser("user");
      const outsider = await createDummyUser("user");
      const project = await createProject({ status: "active", peerEvalOpen });
      const team = await Team.create({
        project: project._id,
        name: "Team",
        members: [studentA._id, studentB._id],
      });
      return { studentA, studentB, outsider, project, team };
    };

    const evaluationFor = (targetId: string) => ({
      targetId,
      contributionScore: 1,
      contributionComment: "Did great work",
      teambuildingScore: 0,
      teambuildingComment: "Communicated fine",
    });

    it("upserts evaluations for teammates without duplicating", async () => {
      const { studentA, studentB, project } = await setupTeam();
      loginAs(studentA);

      const first = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(studentB._id.toString())],
      });
      expect(first.success).toBe(true);

      const second = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          { ...evaluationFor(studentB._id.toString()), contributionScore: -1 },
        ],
      });
      expect(second.success).toBe(true);

      const evals = await PeerEvaluation.find({ project: project._id });
      expect(evals).toHaveLength(1);
      expect(evals[0].contributionScore).toBe(-1);
    });

    it("rejects when the gate is closed, target is self, or target is not a teammate", async () => {
      const { studentA, studentB, outsider, project } = await setupTeam(false);
      loginAs(studentA);

      const gateClosed = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(studentB._id.toString())],
      });
      expect(gateClosed.success).toBe(false);

      await GroupProject.updateOne(
        { _id: project._id },
        { peerEvalOpen: true }
      );

      const selfEval = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(studentA._id.toString())],
      });
      expect(selfEval.success).toBe(false);

      const notTeammate = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(outsider._id.toString())],
      });
      expect(notTeammate.success).toBe(false);
    });
  });

  describe("lifecycle", () => {
    const baseProject = {
      status: "formation" as const,
      startDate: new Date("2026-09-01"),
      peerEvalOpen: false,
      teamEvalOpen: false,
    };

    it("activates a formation project once the start date arrives", () => {
      expect(
        dueLifecycleUpdates(baseProject, new Date("2026-08-31T23:00:00Z"))
      ).toEqual({});
      expect(
        dueLifecycleUpdates(baseProject, new Date("2026-09-01T00:00:00Z"))
      ).toEqual({ status: "active" });
    });

    it("opens team eval on the presentation day and peer eval after the last slot", () => {
      const project = {
        ...baseProject,
        status: "active" as const,
        presentationDate: new Date("2026-10-16"),
        presentationSlots: [
          { startTime: "10:00", endTime: "10:30" },
          { startTime: "11:00", endTime: "11:30" },
        ],
      };

      expect(
        dueLifecycleUpdates(project, new Date("2026-10-15T12:00:00Z"))
      ).toEqual({});
      expect(
        dueLifecycleUpdates(project, new Date("2026-10-16T09:00:00Z"))
      ).toEqual({ teamEvalOpen: true });
      expect(
        dueLifecycleUpdates(project, new Date("2026-10-16T11:30:00Z"))
      ).toEqual({ teamEvalOpen: true, peerEvalOpen: true });
    });

    it("fires each transition only once, so teacher overrides stick", () => {
      const project = {
        ...baseProject,
        status: "active" as const,
        presentationDate: new Date("2026-10-16"),
        presentationSlots: [],
      };
      const afterPresentations = new Date("2026-10-20T12:00:00Z");

      // Gates were auto-opened, then manually closed by a teacher: they stay closed.
      expect(
        dueLifecycleUpdates(
          {
            ...project,
            autoApplied: { teamEvalOpened: true, peerEvalOpened: true },
          },
          afterPresentations
        )
      ).toEqual({});

      // Status was auto-activated, then reverted to formation: it stays reverted.
      expect(
        dueLifecycleUpdates(
          { ...baseProject, autoApplied: { activated: true } },
          afterPresentations
        )
      ).toEqual({});
    });

    it("falls back to end of day for peer eval when no slots exist, and leaves archived projects alone", () => {
      const project = {
        ...baseProject,
        status: "active" as const,
        presentationDate: new Date("2026-10-16"),
        presentationSlots: [],
      };
      expect(
        dueLifecycleUpdates(project, new Date("2026-10-16T12:00:00Z"))
      ).toEqual({ teamEvalOpen: true });
      expect(
        dueLifecycleUpdates(project, new Date("2026-10-17T00:00:00Z"))
      ).toEqual({ teamEvalOpen: true, peerEvalOpen: true });

      expect(
        dueLifecycleUpdates(
          { ...project, status: "archived" },
          new Date("2026-10-17T00:00:00Z")
        )
      ).toEqual({});
    });

    it("lets students submit team evaluations once the presentation day arrives, without a prior read", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({
        status: "active",
        teamEvalOpen: false,
        presentationDate: new Date("2020-01-01"), // long past
      });
      const otherTeam = await Team.create({ project: project._id, name: "Other" });
      loginAs(student);

      const result = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: otherTeam._id.toString(),
        entries: defaultRubricEntries(),
        overallComment: "",
      });
      expect(result.success).toBe(true);

      const stored = await GroupProject.findById(project._id);
      expect(stored.teamEvalOpen).toBe(true);
      expect(stored.peerEvalOpen).toBe(true);
      // the transitions are marked as fired so a manual close sticks
      expect(stored.autoApplied.teamEvalOpened).toBe(true);
      expect(stored.autoApplied.peerEvalOpened).toBe(true);
    });
  });

  describe("module tech stack and rubric", () => {
    it("rejects tech picks outside the project's module", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ module: 1 });
      loginAs(student);

      const invalid = await savePreferences({
        projectId: project._id.toString(),
        ...completePrefs({ techStack: ["NextJS"] }),
      });
      expect(invalid.success).toBe(false);

      const valid = await savePreferences({
        projectId: project._id.toString(),
        ...completePrefs({ techStack: ["HTML", "Figma"] }),
      });
      expect(valid.success).toBe(true);
    });

    it("validates team evaluation categories against the project rubric and requires every score", async () => {
      const teacher = await createDummyUser("teacher");
      const project = await createProject({
        rubric: [
          { key: "product-demo", title: "Product Demo", description: "" },
          { key: "work-organization", title: "Work Organization", description: "" },
        ],
      });
      const team = await Team.create({ project: project._id, name: "A" });
      loginAs(teacher);

      const unknown = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: team._id.toString(),
        entries: [{ category: "product", score: 5, comment: "Fine" }],
        overallComment: "",
      });
      expect(unknown.success).toBe(false);

      const incomplete = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: team._id.toString(),
        entries: [{ category: "product-demo", score: 5, comment: "Fine" }],
        overallComment: "",
      });
      expect(incomplete.success).toBe(false);

      const complete = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: team._id.toString(),
        entries: [
          { category: "product-demo", score: 5, comment: "Fine" },
          { category: "work-organization", score: 7, comment: "" },
        ],
        overallComment: "",
      });
      expect(complete.success).toBe(true);
    });

    it("requires at least one comment somewhere, and stores the overall comment", async () => {
      const teacher = await createDummyUser("teacher");
      const project = await createProject();
      const team = await Team.create({ project: project._id, name: "A" });
      loginAs(teacher);

      const noComments = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: team._id.toString(),
        entries: defaultRubricEntries(""),
        overallComment: "",
      });
      expect(noComments.success).toBe(false);

      const withOverall = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: team._id.toString(),
        entries: defaultRubricEntries(""),
        overallComment: "Great energy on stage",
      });
      expect(withOverall.success).toBe(true);

      const overall = await TeamEvaluation.findOne({
        project: project._id,
        category: "overall",
      });
      expect(overall.comment).toBe("Great energy on stage");
      expect(overall.score).toBeUndefined();
    });
  });

  describe("external judges", () => {
    // Rubric with one row per discipline, so focus rules are easy to assert.
    const disciplinedRubric = [
      { key: "ui", title: "UI", description: "", discipline: "design" },
      { key: "code-quality", title: "Code", description: "", discipline: "code" },
      { key: "qa", title: "Q&A", description: "", discipline: "general" },
    ];

    const invite = async (focus: "all" | "design" | "code") => {
      const teacher = await createDummyUser("teacher");
      const project = await createProject(
        { status: "active", rubric: disciplinedRubric },
        teacher
      );
      const team = await Team.create({ project: project._id, name: "A" });
      loginAs(teacher);
      const created = await createJudgeInvitation({
        projectId: project._id.toString(),
        name: "Jane Judge",
        focus,
      });
      if (!created.success) throw new Error(created.message);
      return { project, team, ...created.data };
    };

    it("only teachers can invite judges", async () => {
      const student = await createDummyUser("user");
      const project = await createProject();
      loginAs(student);
      const denied = await createJudgeInvitation({
        projectId: project._id.toString(),
        name: "X",
        focus: "all",
      });
      expect(denied.success).toBe(false);
    });

    it("a design judge may skip coding rows but must score design and general rows", async () => {
      const { team, token } = await invite("design");

      const missingGeneral = await submitJudgeEvaluation({
        token,
        teamId: team._id.toString(),
        entries: [{ category: "ui", score: 9, comment: "Lovely" }],
        overallComment: "",
      });
      expect(missingGeneral.success).toBe(false);

      const withoutCode = await submitJudgeEvaluation({
        token,
        teamId: team._id.toString(),
        entries: [
          { category: "ui", score: 9, comment: "Lovely" },
          { category: "qa", score: 7, comment: "" },
        ],
        overallComment: "",
      });
      expect(withoutCode.success).toBe(true);

      const stored = await TeamEvaluation.find({ team: team._id });
      expect(stored).toHaveLength(2);
      expect(stored.every((entry) => entry.judge)).toBe(true);
    });

    it("an 'all' judge must score everything, and a bad token is rejected", async () => {
      const { team, token } = await invite("all");

      const partial = await submitJudgeEvaluation({
        token,
        teamId: team._id.toString(),
        entries: [
          { category: "ui", score: 9, comment: "Nice" },
          { category: "qa", score: 7, comment: "" },
        ],
        overallComment: "",
      });
      expect(partial.success).toBe(false);

      const badToken = await submitJudgeEvaluation({
        token: "not-a-real-token",
        teamId: team._id.toString(),
        entries: [
          { category: "ui", score: 9, comment: "Nice" },
          { category: "code-quality", score: 8, comment: "" },
          { category: "qa", score: 7, comment: "" },
        ],
        overallComment: "",
      });
      expect(badToken.success).toBe(false);
    });

    it("refuses to delete an invitation once the judge has graded", async () => {
      const { team, token, id } = await invite("all");

      await submitJudgeEvaluation({
        token,
        teamId: team._id.toString(),
        entries: [
          { category: "ui", score: 9, comment: "Nice" },
          { category: "code-quality", score: 8, comment: "" },
          { category: "qa", score: 7, comment: "" },
        ],
        overallComment: "",
      });

      const denied = await deleteJudgeInvitation({ invitationId: id });
      expect(denied.success).toBe(false);
      expect(await JudgeInvitation.findById(id)).not.toBeNull();
    });
  });

  describe("submitTeamEvaluation", () => {
    it("blocks students from their own team and when the gate is closed, allows teachers anytime", async () => {
      const student = await createDummyUser("user");
      const teacher = await createDummyUser("teacher");
      const project = await createProject({
        status: "active",
        teamEvalOpen: false,
      });
      const ownTeam = await Team.create({
        project: project._id,
        name: "Own",
        members: [student._id],
      });
      const otherTeam = await Team.create({ project: project._id, name: "Other" });

      const entries = defaultRubricEntries();

      loginAs(student);
      const gateClosed = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: otherTeam._id.toString(),
        entries,
      });
      expect(gateClosed.success).toBe(false);

      await GroupProject.updateOne(
        { _id: project._id },
        { teamEvalOpen: true }
      );

      const ownTeamEval = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: ownTeam._id.toString(),
        entries,
      });
      expect(ownTeamEval.success).toBe(false);

      const valid = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: otherTeam._id.toString(),
        entries,
      });
      expect(valid.success).toBe(true);

      await GroupProject.updateOne(
        { _id: project._id },
        { teamEvalOpen: false }
      );
      loginAs(teacher);
      const teacherEval = await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: otherTeam._id.toString(),
        entries,
      });
      expect(teacherEval.success).toBe(true);
    });
  });
});
