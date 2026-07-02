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
import { updateTeamHub } from "serverActions/groups/updateTeamHub";
import { submitPeerEvaluations } from "serverActions/groups/submitPeerEvaluations";
import { submitTeamEvaluation } from "serverActions/groups/submitTeamEvaluation";
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

const createProject = async (
  overrides: Record<string, unknown> = {},
  creator?: UserDocument
) => {
  const teacher = creator ?? (await createDummyUser("teacher"));
  return GroupProject.create({
    title: "Test Project",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-02-01"),
    status: "formation",
    createdBy: teacher._id,
    ...overrides,
  });
};

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
        ambition: "Ambitious",
        focus: ["Frontend"],
        techStack: ["React"],
        about: "I love CSS",
      });
      expect(first.success).toBe(true);

      const second = await savePreferences({
        projectId: project._id.toString(),
        ambition: "Basics",
        focus: ["Design"],
        techStack: [],
        about: "",
      });
      expect(second.success).toBe(true);

      const prefs = await GroupPreference.find({ project: project._id });
      expect(prefs).toHaveLength(1);
      expect(prefs[0].ambition).toBe("Basics");
    });

    it("rejects changes once the project is active", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ status: "active" });
      loginAs(student);

      const result = await savePreferences({
        projectId: project._id.toString(),
        ambition: "Basics",
        focus: [],
        techStack: [],
        about: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateTeamHub", () => {
    const hubData = (teamId: string) => ({
      teamId,
      name: "Renamed Team",
      projectName: "Cool App",
      projectDescription: "An app",
      links: {
        github: "https://github.com/team",
        figma: "",
        figjam: "",
        website: "",
        backend: "",
      },
      images: ["https://example.com/a.png", "", ""],
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
      // blank image slots are dropped
      expect(updated.images).toHaveLength(1);
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

      const entries = [{ category: "product" as const, score: 8, comment: "Nice" }];

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
