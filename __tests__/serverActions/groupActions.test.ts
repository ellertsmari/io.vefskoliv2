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
import { Team } from "models/team";
import { GroupPreference } from "models/groupPreference";
import { PeerEvaluation } from "models/peerEvaluation";
import {
  createGroupProject,
  updateGroupProject,
} from "serverActions/groups/manageGroupProject";
import { saveAssignments, createTeam, deleteTeam } from "serverActions/groups/manageTeams";
import { savePreferences } from "serverActions/groups/savePreferences";
import { getGroupProjects } from "serverActions/groups/getGroupProjects";
import { getGroupProject } from "serverActions/groups/getGroupProject";
import { getEvaluationReports } from "serverActions/groups/getEvaluationReports";
import { updateTeamHub } from "serverActions/groups/updateTeamHub";
import { submitPeerEvaluations } from "serverActions/groups/submitPeerEvaluations";
import {
  clearPeerEvalResult,
  confirmAllPeerEvalResults,
  confirmPeerEvalResult,
} from "serverActions/groups/managePeerEvalResults";
import { PeerEvaluationResult } from "models/peerEvaluationResult";
import { setShowcaseQuotes } from "serverActions/groups/setShowcaseQuotes";
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

    const evaluationFor = (
      targetId: string,
      contributionScore = 0,
      teambuildingScore = 0
    ) => ({
      targetId,
      contributionScore,
      contributionComment: "Did great work",
      teambuildingScore,
      teambuildingComment: "Communicated fine",
    });

    // Every submission has to cover the whole team and stay within budget, so
    // the everyday case is "both of us were average".
    const evenTeam = (a: string, b: string) => [
      evaluationFor(a),
      evaluationFor(b),
    ];

    it("upserts evaluations for teammates without duplicating", async () => {
      const { studentA, studentB, project } = await setupTeam();
      loginAs(studentA);
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];

      const first = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: evenTeam(idA, idB),
      });
      expect(first.success).toBe(true);

      const second = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          evaluationFor(idA, 1),
          evaluationFor(idB, -1),
        ],
      });
      expect(second.success).toBe(true);

      const evals = await PeerEvaluation.find({ project: project._id });
      expect(evals).toHaveLength(2);
      const forB = evals.find((entry) => entry.target.toString() === idB);
      expect(forB?.contributionScore).toBe(-1);
    });

    it("rejects when the gate is closed or the target is not a teammate", async () => {
      const { studentA, studentB, outsider, project } = await setupTeam(false);
      loginAs(studentA);
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];

      const gateClosed = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: evenTeam(idA, idB),
      });
      expect(gateClosed.success).toBe(false);

      await GroupProject.updateOne(
        { _id: project._id },
        { peerEvalOpen: true }
      );

      const notTeammate = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          evaluationFor(idA),
          evaluationFor(outsider._id.toString()),
        ],
      });
      expect(notTeammate.success).toBe(false);
      expect(notTeammate.message).toMatch(/members of your own team/i);
    });

    it("accepts a self-evaluation alongside the teammates", async () => {
      const { studentA, studentB, project } = await setupTeam();
      loginAs(studentA);

      const result = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          evaluationFor(studentA._id.toString(), 2, 1),
          evaluationFor(studentB._id.toString(), -2, -1),
        ],
      });
      expect(result.success).toBe(true);

      const selfEval = await PeerEvaluation.findOne({
        project: project._id,
        evaluator: studentA._id,
        target: studentA._id,
      }).lean<{ contributionScore: number } | null>();
      expect(selfEval?.contributionScore).toBe(2);
    });

    it("refuses to rate the team above its own average, on either axis", async () => {
      const { studentA, studentB, project } = await setupTeam();
      loginAs(studentA);
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];

      const inflated = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(idA, 2), evaluationFor(idB, 1)],
      });
      expect(inflated.success).toBe(false);
      expect(inflated.message).toMatch(/Contribution scores add up to \+3/);

      const teamworkInflated = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          evaluationFor(idA, 0, 1),
          evaluationFor(idB, 0, 0),
        ],
      });
      expect(teamworkInflated.success).toBe(false);
      expect(teamworkInflated.message).toMatch(/Teamwork scores add up to \+1/);

      expect(await PeerEvaluation.countDocuments({})).toBe(0);
    });

    it("allows a team to be rated below average, and an even team", async () => {
      const { studentA, studentB, project } = await setupTeam();
      loginAs(studentA);
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];

      const even = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: evenTeam(idA, idB),
      });
      expect(even.success).toBe(true);

      const belowAverage = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          evaluationFor(idA, -1, -1),
          evaluationFor(idB, -2, 0),
        ],
      });
      expect(belowAverage.success).toBe(true);
    });

    it("requires the whole team, scored once each", async () => {
      const { studentA, studentB, project } = await setupTeam();
      loginAs(studentA);
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];

      // Only oneself: balanced on its own, but says nothing about the team.
      const onlySelf = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(idA, 0)],
      });
      expect(onlySelf.success).toBe(false);
      expect(onlySelf.message).toMatch(/everyone on the team/i);

      // Scoring the same teammate twice would let a phantom row balance the
      // books while only one of them is stored.
      const duplicated = await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [
          evaluationFor(idA, 2),
          evaluationFor(idA, -2),
          evaluationFor(idB, 0),
        ],
      });
      expect(duplicated.success).toBe(false);
      expect(duplicated.message).toMatch(/single score/i);

      expect(await PeerEvaluation.countDocuments({})).toBe(0);
    });

    it("counts the self-evaluation in the teacher report and flags who wrote it", async () => {
      const { studentA, studentB, project } = await setupTeam();
      const teacher = await createDummyUser("teacher");
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];

      // A rates themselves +2 and B -2; B rates both 0 → advisory average of
      // +1 for A.
      loginAs(studentA);
      await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: [evaluationFor(idA, 2), evaluationFor(idB, -2)],
      });
      loginAs(studentB);
      await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: evenTeam(idA, idB),
      });

      loginAs(teacher);
      const reports = await getEvaluationReports(project._id.toString());
      const reportForA = reports?.peerEvals.find(
        (entry) => entry.userId === studentA._id.toString()
      );
      expect(reportForA?.receivedCount).toBe(2);
      expect(reportForA?.contributionAvg).toBe(1);
      expect(reportForA?.combinedAvg).toBe(0.5);
      expect(reportForA?.received.filter((entry) => entry.isSelf)).toHaveLength(
        1
      );
      // Both submissions obeyed the rule, so nothing is flagged.
      expect(reportForA?.givenUnbalanced).toBe(false);
      expect(
        reportForA?.received.every((entry) => !entry.evaluatorUnbalanced)
      ).toBe(true);
    });

    it("flags evaluations stored before the rule instead of rewriting them", async () => {
      const { studentA, studentB, project, team } = await setupTeam();
      const teacher = await createDummyUser("teacher");

      // Written straight to the collection, the way the one pre-rule
      // submission sits in the live database: everybody above average.
      await PeerEvaluation.create([
        {
          project: project._id,
          team: team._id,
          evaluator: studentA._id,
          target: studentA._id,
          contributionScore: 2,
          contributionComment: "me",
          teambuildingScore: 2,
          teambuildingComment: "me",
        },
        {
          project: project._id,
          team: team._id,
          evaluator: studentA._id,
          target: studentB._id,
          contributionScore: 1,
          contributionComment: "them",
          teambuildingScore: 1,
          teambuildingComment: "them",
        },
      ]);

      loginAs(teacher);
      const reports = await getEvaluationReports(project._id.toString());
      const reportForA = reports?.peerEvals.find(
        (entry) => entry.userId === studentA._id.toString()
      );
      const reportForB = reports?.peerEvals.find(
        (entry) => entry.userId === studentB._id.toString()
      );

      // Untouched: the scores still read exactly as they were stored.
      expect(reportForA?.contributionAvg).toBe(2);
      expect(reportForB?.contributionAvg).toBe(1);
      // ...and flagged, on the giver's row and on every entry they wrote.
      expect(reportForA?.givenUnbalanced).toBe(true);
      expect(reportForB?.received[0]?.evaluatorUnbalanced).toBe(true);
    });
  });

  describe("peer evaluation results", () => {
    // A team where the advice is unambiguous: both students rate A above B.
    const setupEvaluatedTeam = async () => {
      const studentA = await createDummyUser("user");
      const studentB = await createDummyUser("user");
      const teacher = await createDummyUser("teacher");
      const project = await createProject({
        status: "active",
        peerEvalOpen: true,
      });
      await Team.create({
        project: project._id,
        name: "Team",
        members: [studentA._id, studentB._id],
      });
      const [idA, idB] = [studentA._id.toString(), studentB._id.toString()];
      const scores = (a: number, b: number) => [
        {
          targetId: idA,
          contributionScore: a,
          contributionComment: "c",
          teambuildingScore: a,
          teambuildingComment: "t",
        },
        {
          targetId: idB,
          contributionScore: b,
          contributionComment: "c",
          teambuildingScore: b,
          teambuildingComment: "t",
        },
      ];
      loginAs(studentA);
      await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: scores(1, -1),
      });
      loginAs(studentB);
      await submitPeerEvaluations({
        projectId: project._id.toString(),
        evaluations: scores(1, -1),
      });
      return { studentA, studentB, teacher, project, idA, idB };
    };

    it("confirms the team's average and remembers what it was based on", async () => {
      const { teacher, project, idA } = await setupEvaluatedTeam();
      loginAs(teacher);

      const result = await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idA,
        contribution: 1,
        teambuilding: 1,
        note: "",
      });
      expect(result.success).toBe(true);

      const stored = await PeerEvaluationResult.findOne({
        project: project._id,
        student: idA,
      }).lean<{
        contribution: number;
        teambuilding: number;
        basedOnContribution: number;
        basedOnCount: number;
      } | null>();
      expect(stored?.contribution).toBe(1);
      expect(stored?.basedOnContribution).toBe(1);
      expect(stored?.basedOnCount).toBe(2);

      const reports = await getEvaluationReports(project._id.toString());
      const reportForA = reports?.peerEvals.find(
        (entry) => entry.userId === idA
      );
      expect(reportForA?.combinedAvg).toBe(1);
      expect(reportForA?.result?.contribution).toBe(1);
      expect(reportForA?.result?.confirmedByName).toBe(teacher.name);
    });

    it("lets a teacher override the average, with a note, and change it again", async () => {
      const { teacher, project, idB } = await setupEvaluatedTeam();
      loginAs(teacher);

      await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idB,
        contribution: -0.5,
        teambuilding: -0.5,
        note: "Was ill for a week, agreed beforehand",
      });
      const changed = await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idB,
        contribution: 0,
        teambuilding: 0,
        note: "Talked to the team",
      });
      expect(changed.success).toBe(true);

      expect(
        await PeerEvaluationResult.countDocuments({ project: project._id })
      ).toBe(1);
      const reports = await getEvaluationReports(project._id.toString());
      const reportForB = reports?.peerEvals.find(
        (entry) => entry.userId === idB
      );
      expect(reportForB?.combinedAvg).toBe(-1);
      expect(reportForB?.result?.contribution).toBe(0);
      expect(reportForB?.result?.note).toBe("Talked to the team");
    });

    it("keeps students out, and rejects a score off the scale", async () => {
      const { studentA, teacher, project, idA } = await setupEvaluatedTeam();

      loginAs(studentA);
      const asStudent = await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idA,
        contribution: 2,
        teambuilding: 2,
        note: "",
      });
      expect(asStudent.success).toBe(false);

      loginAs(teacher);
      const offScale = await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idA,
        contribution: 7,
        teambuilding: 0,
        note: "",
      });
      expect(offScale.success).toBe(false);
      expect(await PeerEvaluationResult.countDocuments({})).toBe(0);
    });

    it("confirms every unconfirmed student at once, leaving decided ones alone", async () => {
      const { teacher, project, idA, idB } = await setupEvaluatedTeam();
      loginAs(teacher);

      await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idB,
        contribution: 0,
        teambuilding: 0,
        note: "already decided",
      });

      const bulk = await confirmAllPeerEvalResults({
        projectId: project._id.toString(),
      });
      expect(bulk.success).toBe(true);

      const reports = await getEvaluationReports(project._id.toString());
      const forA = reports?.peerEvals.find((entry) => entry.userId === idA);
      const forB = reports?.peerEvals.find((entry) => entry.userId === idB);
      expect(forA?.result?.contribution).toBe(1);
      // Untouched by the bulk confirm.
      expect(forB?.result?.contribution).toBe(0);
      expect(forB?.result?.note).toBe("already decided");
    });

    it("clears a result back to pending", async () => {
      const { teacher, project, idA } = await setupEvaluatedTeam();
      loginAs(teacher);

      await confirmPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idA,
        contribution: 1,
        teambuilding: 1,
        note: "",
      });
      const cleared = await clearPeerEvalResult({
        projectId: project._id.toString(),
        studentId: idA,
      });
      expect(cleared.success).toBe(true);

      const reports = await getEvaluationReports(project._id.toString());
      const forA = reports?.peerEvals.find((entry) => entry.userId === idA);
      expect(forA?.result).toBeNull();
    });
  });

  describe("feedback visibility", () => {
    // Two teams, both gates open: A is the team under study, B is there to be
    // scored (and to score back).
    const setupTwoTeams = async () => {
      const studentA = await createDummyUser("user");
      const studentB = await createDummyUser("user");
      const studentC = await createDummyUser("user");
      const teacher = await createDummyUser("teacher");
      const project = await createProject({
        status: "active",
        peerEvalOpen: true,
        teamEvalOpen: true,
      });
      const teamA = await Team.create({
        project: project._id,
        name: "Team A",
        members: [studentA._id, studentB._id],
      });
      const teamB = await Team.create({
        project: project._id,
        name: "Team B",
        members: [studentC._id],
      });
      return { studentA, studentB, studentC, teacher, project, teamA, teamB };
    };

    const scoreTeam = async (
      evaluator: UserDocument,
      projectId: string,
      teamId: string,
      comment: string
    ) => {
      loginAs(evaluator);
      return submitTeamEvaluation({
        projectId,
        teamId,
        entries: defaultRubricEntries(comment),
        overallComment: "",
      });
    };

    const handInPeerEval = async (
      student: UserDocument,
      projectId: string,
      memberIds: string[]
    ) => {
      loginAs(student);
      return submitPeerEvaluations({
        projectId,
        evaluations: memberIds.map((targetId) => ({
          targetId,
          contributionScore: 0,
          contributionComment: "even",
          teambuildingScore: 0,
          teambuildingComment: "even",
        })),
      });
    };

    it("keeps a team's feedback shut until that student has handed in", async () => {
      const { studentA, studentB, teacher, project, teamA, teamB } =
        await setupTwoTeams();
      const projectId = project._id.toString();
      await scoreTeam(teacher, projectId, teamA._id.toString(), "Nice work");

      loginAs(studentA);
      const before = await getGroupProject(projectId);
      expect(before?.myFeedbackUnlock).toEqual({
        unlocked: false,
        teamsToScore: 1,
        peerEvalPending: true,
      });
      expect(before?.myTeamFeedback).toEqual([]);

      // Hand in half of it — still shut, and the remaining work is named.
      await handInPeerEval(studentA, projectId, [
        studentA._id.toString(),
        studentB._id.toString(),
      ]);
      loginAs(studentA);
      const halfway = await getGroupProject(projectId);
      expect(halfway?.myFeedbackUnlock).toEqual({
        unlocked: false,
        teamsToScore: 1,
        peerEvalPending: false,
      });

      // Hand in the rest: open, without waiting for anybody else.
      await scoreTeam(studentA, projectId, teamB._id.toString(), "Good demo");
      loginAs(studentA);
      const after = await getGroupProject(projectId);
      expect(after?.myFeedbackUnlock.unlocked).toBe(true);
      expect(after?.myTeamFeedback).toHaveLength(1);

      // ...and their teammate, who handed in nothing, still sees nothing.
      loginAs(studentB);
      const teammate = await getGroupProject(projectId);
      expect(teammate?.myFeedbackUnlock.unlocked).toBe(false);
      expect(teammate?.myTeamFeedback).toEqual([]);
    });

    it("opens to everyone once the project is completed", async () => {
      const { studentB, teacher, project, teamA } = await setupTwoTeams();
      const projectId = project._id.toString();
      await scoreTeam(teacher, projectId, teamA._id.toString(), "Nice work");

      await GroupProject.updateOne(
        { _id: project._id },
        { status: "archived" }
      );

      loginAs(studentB);
      const details = await getGroupProject(projectId);
      expect(details?.myFeedbackUnlock.unlocked).toBe(true);
      expect(details?.myTeamFeedback).toHaveLength(1);
    });

    it("names teachers and judges, never classmates, and carries no scores", async () => {
      const { studentA, studentB, studentC, teacher, project, teamA, teamB } =
        await setupTwoTeams();
      const projectId = project._id.toString();
      const teamAId = teamA._id.toString();

      await scoreTeam(teacher, projectId, teamAId, "Teacher says hello");
      await scoreTeam(studentC, projectId, teamAId, "Classmate says hello");

      loginAs(teacher);
      const invitation = await createJudgeInvitation({
        projectId,
        name: "Judge Judy",
        focus: "all",
      });
      expect(invitation.success).toBe(true);
      if (!invitation.success) return;
      await submitJudgeEvaluation({
        token: invitation.data.token,
        teamId: teamAId,
        entries: defaultRubricEntries("Judge says hello"),
        overallComment: "",
      });

      await handInPeerEval(studentA, projectId, [
        studentA._id.toString(),
        studentB._id.toString(),
      ]);
      await scoreTeam(studentA, projectId, teamB._id.toString(), "Good demo");

      loginAs(studentA);
      const details = await getGroupProject(projectId);
      const feedback = details?.myTeamFeedback ?? [];
      expect(feedback).toHaveLength(3);

      const fromTeacher = feedback.find((e) => e.evaluatorKind === "teacher");
      const fromJudge = feedback.find((e) => e.evaluatorKind === "judge");
      const fromStudent = feedback.find((e) => e.evaluatorKind === "student");
      expect(fromTeacher?.evaluatorName).toBe(teacher.name);
      expect(fromJudge?.evaluatorName).toBe("Judge Judy");
      // The classmate's name is absent from the payload, not merely unrendered.
      expect(fromStudent?.evaluatorName).toBeNull();
      expect(JSON.stringify(feedback)).not.toContain(studentC.name);
      // No individual scores reach a student, ever.
      expect(JSON.stringify(feedback)).not.toContain("score");
    });

    it("holds the scores back until the teachers release them", async () => {
      const { studentA, studentB, studentC, teacher, project, teamA, teamB } =
        await setupTwoTeams();
      const projectId = project._id.toString();
      const teamAId = teamA._id.toString();

      // Panel 10, audience 4 → 0.8 * 10 + 0.2 * 4 = 8.8 for "product".
      loginAs(teacher);
      await submitTeamEvaluation({
        projectId,
        teamId: teamAId,
        entries: [
          { category: "product", score: 10, comment: "Excellent" },
          { category: "presentation", score: 10, comment: "" },
          { category: "qa", score: 10, comment: "" },
        ],
        overallComment: "",
      });
      loginAs(studentC);
      await submitTeamEvaluation({
        projectId,
        teamId: teamAId,
        entries: [
          { category: "product", score: 4, comment: "Rough" },
          { category: "presentation", score: 4, comment: "" },
          { category: "qa", score: 4, comment: "" },
        ],
        overallComment: "",
      });

      await handInPeerEval(studentA, projectId, [
        studentA._id.toString(),
        studentB._id.toString(),
      ]);
      await scoreTeam(studentA, projectId, teamB._id.toString(), "Good demo");

      loginAs(studentA);
      const beforeRelease = await getGroupProject(projectId);
      expect(beforeRelease?.myFeedbackUnlock.unlocked).toBe(true);
      expect(beforeRelease?.myGrade).toBeNull();

      loginAs(teacher);
      const released = await updateGroupProject({
        projectId,
        gradesReleased: true,
      });
      expect(released.success).toBe(true);

      loginAs(studentA);
      const afterRelease = await getGroupProject(projectId);
      // Released, but nobody confirmed what the peer evaluation came to for
      // this student: no individual grade, and no falling back to the team's
      // numbers either.
      expect(afterRelease?.myGrade).toBeNull();
      expect(JSON.stringify(afterRelease)).not.toContain("8.8");

      loginAs(teacher);
      const confirmed = await confirmPeerEvalResult({
        projectId,
        studentId: studentA._id.toString(),
        contribution: 1,
        teambuilding: 1,
        note: "",
      });
      expect(confirmed.success).toBe(true);

      loginAs(studentA);
      const withGrade = await getGroupProject(projectId);
      // P = 3 × 3 − 4 = 5 → factor 1.125 → 8.8 × 1.125 = 9.9
      expect(withGrade?.myGrade).toEqual({
        grade: 9.9,
        categories: { product: 9.9, presentation: 9.9, qa: 9.9 },
      });
      // The team's own grade is the student's to infer from nothing: neither
      // the project grade (8.8) nor the factor (1.125) is in the payload, so
      // one cannot be divided out of the other.
      const payload = JSON.stringify(withGrade);
      expect(payload).not.toContain("8.8");
      expect(payload).not.toContain("1.125");

      // The teammate who never handed in sees none of it, released or not.
      loginAs(studentB);
      const teammate = await getGroupProject(projectId);
      expect(teammate?.myGrade).toBeNull();
      expect(JSON.stringify(teammate)).not.toContain("8.8");
    });

    it("gives the teacher the grade their confirmation would publish", async () => {
      const { studentA, studentC, teacher, project, teamA } =
        await setupTwoTeams();
      const projectId = project._id.toString();
      const teamAId = teamA._id.toString();

      loginAs(teacher);
      await submitTeamEvaluation({
        projectId,
        teamId: teamAId,
        entries: [
          { category: "product", score: 8, comment: "Good" },
          { category: "presentation", score: 8, comment: "" },
          { category: "qa", score: 8, comment: "" },
        ],
        overallComment: "",
      });
      loginAs(studentC);
      await submitTeamEvaluation({
        projectId,
        teamId: teamAId,
        entries: [
          { category: "product", score: 8, comment: "Good" },
          { category: "presentation", score: 8, comment: "" },
          { category: "qa", score: 8, comment: "" },
        ],
        overallComment: "",
      });

      loginAs(teacher);
      await confirmPeerEvalResult({
        projectId,
        studentId: studentA._id.toString(),
        // Carried the work, impossible to work with.
        contribution: 2,
        teambuilding: -2,
        note: "Did most of it alone, and that was the problem",
      });

      const reports = await getEvaluationReports(projectId);
      const forA = reports?.peerEvals.find(
        (entry) => entry.userId === studentA._id.toString()
      );
      // P = 4 × 0 − 4 = −4 → factor 0.3 → 8 × 0.3 = 2.4
      expect(forA?.grade?.projectGrade).toBe(8);
      expect(forA?.grade?.factor).toBe(0.3);
      expect(forA?.grade?.grade).toBe(2.4);

      // Grades are not released, so the student still sees nothing.
      loginAs(studentA);
      const student = await getGroupProject(projectId);
      expect(student?.myGrade).toBeNull();
    });
  });

  describe("showcase quotes", () => {
    const setupFeedback = async () => {
      const student = await createDummyUser("user");
      const outsider = await createDummyUser("user");
      const teacher = await createDummyUser("teacher");
      const project = await createProject({ status: "active" });
      const team = await Team.create({
        project: project._id,
        name: "Team",
        members: [student._id],
      });
      const other = await Team.create({
        project: project._id,
        name: "Other",
        members: [outsider._id],
      });
      loginAs(teacher);
      await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: team._id.toString(),
        entries: defaultRubricEntries("Worth quoting"),
        overallComment: "",
      });
      await submitTeamEvaluation({
        projectId: project._id.toString(),
        teamId: other._id.toString(),
        entries: defaultRubricEntries("Somebody else's"),
        overallComment: "",
      });
      const mine = await TeamEvaluation.findOne({
        team: team._id,
        category: "product",
      }).lean<{ _id: unknown } | null>();
      const theirs = await TeamEvaluation.findOne({
        team: other._id,
        category: "product",
      }).lean<{ _id: unknown } | null>();
      return {
        student,
        outsider,
        team,
        mineId: String(mine?._id),
        theirsId: String(theirs?._id),
        project,
      };
    };

    it("publishes what a member chose, and works after the project is completed", async () => {
      const { student, team, mineId, project } = await setupFeedback();
      await GroupProject.updateOne(
        { _id: project._id },
        { status: "archived" }
      );

      loginAs(student);
      const result = await setShowcaseQuotes({
        teamId: team._id.toString(),
        evaluationIds: [mineId],
      });
      expect(result.success).toBe(true);

      const stored = await Team.findById(team._id).lean<{
        showcaseQuotes: unknown[];
      } | null>();
      expect(stored?.showcaseQuotes.map(String)).toEqual([mineId]);
    });

    it("refuses another team's feedback, a scoreless row and non-members", async () => {
      const { student, outsider, team, mineId, theirsId, project } =
        await setupFeedback();

      loginAs(student);
      const notMine = await setShowcaseQuotes({
        teamId: team._id.toString(),
        evaluationIds: [mineId, theirsId],
      });
      expect(notMine.success).toBe(false);

      // A row with no comment has nothing to publish.
      const commentless = await TeamEvaluation.findOne({
        team: team._id,
        category: "presentation",
      }).lean<{ _id: unknown } | null>();
      const empty = await setShowcaseQuotes({
        teamId: team._id.toString(),
        evaluationIds: [String(commentless?._id)],
      });
      expect(empty.success).toBe(false);

      loginAs(outsider);
      const stranger = await setShowcaseQuotes({
        teamId: team._id.toString(),
        evaluationIds: [mineId],
      });
      expect(stranger.success).toBe(false);

      expect(project.status).toBe("active");
      const stored = await Team.findById(team._id).lean<{
        showcaseQuotes: unknown[];
      } | null>();
      expect(stored?.showcaseQuotes).toEqual([]);
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

  describe("rubric editing", () => {
    const rows = [
      { key: "product-demo", title: "Product Demo", description: "", discipline: "general" as const },
      { key: "live-coding", title: "Live coding", description: "", discipline: "code" as const },
    ];

    const evaluate = async (
      projectId: string,
      teamId: string,
      entries: { category: string; score: number; comment: string }[]
    ) =>
      submitTeamEvaluation({ projectId, teamId, entries, overallComment: "" });

    it("lets a teacher save a rubric and keeps students out", async () => {
      const teacher = await createDummyUser("teacher");
      const student = await createDummyUser("user");
      const project = await createProject({}, teacher);

      loginAs(student);
      const rejected = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: rows,
      });
      expect(rejected.success).toBe(false);

      loginAs(teacher);
      const saved = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: rows,
      });
      expect(saved.success).toBe(true);

      const stored =
        await GroupProject.findById(project._id).lean<GroupProjectLean | null>();
      expect(stored?.rubric?.map((item) => item.key)).toEqual([
        "product-demo",
        "live-coding",
      ]);
      expect(stored?.rubric?.[1].discipline).toBe("code");
    });

    it("rejects duplicate keys and the reserved overall key", async () => {
      const teacher = await createDummyUser("teacher");
      const project = await createProject({}, teacher);
      loginAs(teacher);

      const duplicate = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: [rows[0], { ...rows[1], key: "product-demo" }],
      });
      expect(duplicate.success).toBe(false);

      const reserved = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: [{ ...rows[0], key: "overall" }],
      });
      expect(reserved.success).toBe(false);
    });

    it("freezes the set of keys once a team has been evaluated, but not the wording", async () => {
      const teacher = await createDummyUser("teacher");
      const project = await createProject({ rubric: rows }, teacher);
      const team = await Team.create({ project: project._id, name: "A" });
      loginAs(teacher);

      await evaluate(project._id.toString(), team._id.toString(), [
        { category: "product-demo", score: 8, comment: "Nice" },
        { category: "live-coding", score: 6, comment: "" },
      ]);

      const added = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: [...rows, { key: "extra", title: "Extra", description: "", discipline: "general" as const }],
      });
      expect(added.success).toBe(false);
      expect(added.message).toContain("extra");

      const removed = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: [rows[0]],
      });
      expect(removed.success).toBe(false);
      expect(removed.message).toContain("live-coding");

      // Same keys, new wording and order — allowed.
      const reworded = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: [
          { ...rows[1], title: "Live coding — clarity", description: "Easy to follow?" },
          { ...rows[0], discipline: "design" as const },
        ],
      });
      expect(reworded.success).toBe(true);

      const stored =
        await GroupProject.findById(project._id).lean<GroupProjectLean | null>();
      expect(stored?.rubric?.[0].title).toBe("Live coding — clarity");
      expect(stored?.rubric?.[1].discipline).toBe("design");

      // The stored score still points at a row that exists.
      const scored = await TeamEvaluation.findOne({
        project: project._id,
        category: "product-demo",
      }).lean<{ score: number } | null>();
      expect(scored?.score).toBe(8);
    });

    it("compares against the default rows when the project has no rubric of its own", async () => {
      const teacher = await createDummyUser("teacher");
      const project = await createProject({}, teacher);
      const team = await Team.create({ project: project._id, name: "A" });
      loginAs(teacher);

      // Evaluated against the fallback rubric (product/presentation/qa).
      await evaluate(
        project._id.toString(),
        team._id.toString(),
        defaultRubricEntries()
      );

      const replaced = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: rows,
      });
      expect(replaced.success).toBe(false);

      // Writing the fallback rows down explicitly changes nothing, so it passes.
      const pinned = await updateGroupProject({
        projectId: project._id.toString(),
        rubric: [
          { key: "product", title: "Product", description: "", discipline: "general" as const },
          { key: "presentation", title: "Presentation", description: "", discipline: "general" as const },
          { key: "qa", title: "Q&A", description: "", discipline: "general" as const },
        ],
      });
      expect(pinned.success).toBe(true);
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
