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
import { TeamEvaluation } from "models/teamEvaluation";
import { JudgeInvitation } from "models/judgeInvitation";
import { getShowcase, getShowcaseTeam } from "serverActions/groups/getShowcase";
import { setShowcaseConsent } from "serverActions/groups/setShowcaseConsent";
import { removeTeamImage } from "serverActions/groups/removeTeamImage";
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

const createProject = async (overrides: Record<string, unknown> = {}) => {
  const teacher = await createDummyUser("teacher");
  return GroupProject.create({
    title: "Showcase Project",
    startDate: new Date("2026-01-10"),
    endDate: new Date("2026-02-10"),
    status: "active",
    createdBy: teacher._id,
    ...overrides,
  });
};

/** A team with a full set of showcase content and nobody having consented yet. */
const createTeamWith = async (
  projectId: unknown,
  members: UserDocument[],
  overrides: Record<string, unknown> = {}
) =>
  Team.create({
    project: projectId,
    name: "The Team",
    members: members.map((member) => member._id),
    projectName: "Cool App",
    tagline: "The coolest of apps",
    coverImage: "https://example.com/cover.png",
    teamPhoto: "https://example.com/photo.png",
    logo: "https://example.com/logo.png",
    ...overrides,
  });

const consentAs = async (user: UserDocument, teamId: string, name: boolean) => {
  loginAs(user);
  return setShowcaseConsent({ teamId, name });
};

describe("public showcase", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase(), 10000);
  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  describe("name consent", () => {
    it("publishes no member names until members opt in", async () => {
      const [a, b] = [
        await createDummyUser("user"),
        await createDummyUser("user"),
      ];
      const project = await createProject();
      const team = await createTeamWith(project._id, [a, b]);

      const before = await getShowcaseTeam(team._id.toString());
      expect(before!.team.memberNames).toEqual([]);

      await consentAs(a, team._id.toString(), true);

      const after = await getShowcaseTeam(team._id.toString());
      // Only the member who agreed — the other is not listed at all.
      expect(after!.team.memberNames).toEqual([a.name]);
    });

    it("never lets one member's choice affect another's", async () => {
      const [a, b] = [
        await createDummyUser("user"),
        await createDummyUser("user"),
      ];
      const project = await createProject();
      const team = await createTeamWith(project._id, [a, b]);
      const teamId = team._id.toString();

      await consentAs(a, teamId, true);
      await consentAs(b, teamId, false);

      // b declining must not remove a, and must not block anything.
      const detail = await getShowcaseTeam(teamId);
      expect(detail!.team.memberNames).toEqual([a.name]);
      expect(detail!.team.teamPhoto).toBe("https://example.com/photo.png");
    });

    it("keeps consent changeable after the project is archived", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ status: "archived" });
      const team = await createTeamWith(project._id, [student]);
      const teamId = team._id.toString();

      // Archived projects stay on the showcase indefinitely, so withdrawal has
      // to keep working long after every other write is locked down.
      await consentAs(student, teamId, true);
      expect((await getShowcaseTeam(teamId))!.team.memberNames).toEqual([
        student.name,
      ]);

      const withdrawal = await consentAs(student, teamId, false);
      expect(withdrawal.success).toBe(true);
      expect((await getShowcaseTeam(teamId))!.team.memberNames).toEqual([]);
    });

    it("ignores a departed member's consent", async () => {
      const [a, b] = [
        await createDummyUser("user"),
        await createDummyUser("user"),
      ];
      const project = await createProject();
      const team = await createTeamWith(project._id, [a, b]);
      const teamId = team._id.toString();

      await consentAs(a, teamId, true);
      await consentAs(b, teamId, true);

      await Team.findByIdAndUpdate(teamId, { members: [a._id] });

      expect((await getShowcaseTeam(teamId))!.team.memberNames).toEqual([
        a.name,
      ]);
    });

    it("refuses to record consent for someone else's team", async () => {
      const member = await createDummyUser("user");
      const outsider = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [member]);

      loginAs(outsider);
      const result = await setShowcaseConsent({
        teamId: team._id.toString(),
        name: true,
      });

      expect(result.success).toBe(false);
      const stored = await Team.findById(team._id);
      expect(stored.showcaseConsents).toHaveLength(0);
    });

    it("refuses to record consent when logged out", async () => {
      (auth as jest.Mock).mockResolvedValue(null);
      const member = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [member]);

      const result = await setShowcaseConsent({
        teamId: team._id.toString(),
        name: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("team photo removal", () => {
    it("publishes the photo without any opt-in", async () => {
      // Consent for a photo is given by being in it when it is taken. Gating it
      // on a checkbox deadlocked teams behind members who were never asked.
      const student = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [student]);

      const detail = await getShowcaseTeam(team._id.toString());
      expect(detail!.team.teamPhoto).toBe("https://example.com/photo.png");
    });

    it("lets any member take the photo down", async () => {
      const [a, b] = [
        await createDummyUser("user"),
        await createDummyUser("user"),
      ];
      const project = await createProject();
      const team = await createTeamWith(project._id, [a, b]);

      // b removes it without a's agreement and without giving a reason.
      loginAs(b);
      const result = await removeTeamImage({
        teamId: team._id.toString(),
        field: "teamPhoto",
      });

      expect(result.success).toBe(true);
      expect((await getShowcaseTeam(team._id.toString()))!.team.teamPhoto).toBe(
        ""
      );
    });

    it("still works once the project is archived", async () => {
      // The whole point: the hub is read-only by then, but the page is still
      // public, so a picture of somebody has to stay removable.
      const student = await createDummyUser("user");
      const project = await createProject({ status: "archived" });
      const team = await createTeamWith(project._id, [student]);

      loginAs(student);
      const result = await removeTeamImage({
        teamId: team._id.toString(),
        field: "teamPhoto",
      });

      expect(result.success).toBe(true);
      expect((await getShowcaseTeam(team._id.toString()))!.team.teamPhoto).toBe(
        ""
      );
    });

    it("refuses removal by someone outside the team", async () => {
      const member = await createDummyUser("user");
      const outsider = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [member]);

      loginAs(outsider);
      const result = await removeTeamImage({
        teamId: team._id.toString(),
        field: "teamPhoto",
      });

      expect(result.success).toBe(false);
      const stored = await Team.findById(team._id);
      expect(stored.teamPhoto).toBe("https://example.com/photo.png");
    });

    it("rejects fields that are not images", async () => {
      const member = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [member]);

      loginAs(member);
      const result = await removeTeamImage({
        teamId: team._id.toString(),
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberate abuse */
        field: "projectName" as any,
      });

      expect(result.success).toBe(false);
      const stored = await Team.findById(team._id);
      expect(stored.projectName).toBe("Cool App");
    });
  });

  describe("scoping and payload", () => {
    it("shows one year at a time and lists the years available", async () => {
      const student = await createDummyUser("user");
      const older = await createProject({
        title: "Class of 2025",
        startDate: new Date("2025-01-10"),
        endDate: new Date("2025-02-10"),
      });
      const newer = await createProject({
        title: "Class of 2026",
        startDate: new Date("2026-01-10"),
        endDate: new Date("2026-02-10"),
      });
      await createTeamWith(older._id, [student], { name: "Old Team" });
      await createTeamWith(newer._id, [student], { name: "New Team" });

      const latest = await getShowcase();
      expect(latest.years).toEqual([2026, 2025]);
      expect(latest.year).toBe(2026);
      expect(latest.projects).toHaveLength(1);
      expect(latest.projects[0].title).toBe("Class of 2026");

      const archive = await getShowcase(2025);
      expect(archive.year).toBe(2025);
      expect(archive.projects[0].title).toBe("Class of 2025");

      // An unknown year falls back to the newest rather than an empty page.
      expect((await getShowcase(1999)).year).toBe(2026);
    });

    it("never puts the team photo in the card grid payload", async () => {
      const student = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [student]);
      // The grid does not render a team photo, so it must not be shipped to
      // every visitor of the index page.
      await consentAs(student, team._id.toString(), true);

      const index = await getShowcase();
      const card = index.projects[0].teams[0];

      expect(card).not.toHaveProperty("teamPhoto");
      expect(card).not.toHaveProperty("projectDescription");
      expect(card.coverImage).toBe("https://example.com/cover.png");
      expect(card.memberNames).toEqual([student.name]);
    });

    it("applies name consent to the card grid too", async () => {
      const [a, b] = [
        await createDummyUser("user"),
        await createDummyUser("user"),
      ];
      const project = await createProject();
      const team = await createTeamWith(project._id, [a, b]);
      await consentAs(a, team._id.toString(), true);

      const index = await getShowcase();
      expect(index.projects[0].teams[0].memberNames).toEqual([a.name]);
    });

    it("leaves formation projects out entirely", async () => {
      const student = await createDummyUser("user");
      const project = await createProject({ status: "formation" });
      const team = await createTeamWith(project._id, [student]);

      expect((await getShowcase()).projects).toHaveLength(0);
      expect(await getShowcaseTeam(team._id.toString())).toBeNull();
    });
  });

  describe("published quotes", () => {
    const quoteSetup = async () => {
      const member = await createDummyUser("user");
      const project = await createProject();
      const team = await createTeamWith(project._id, [member]);
      const teacher = await createDummyUser("teacher");
      return { member, project, team, teacher };
    };

    const publish = async (teamId: unknown, ids: unknown[]) =>
      Team.updateOne({ _id: teamId }, { showcaseQuotes: ids });

    it("names a teacher, keeps classmates anonymous and never shows a score", async () => {
      const { member, project, team, teacher } = await quoteSetup();
      const classmate = await createDummyUser("user");

      const fromTeacher = await TeamEvaluation.create({
        project: project._id,
        team: team._id,
        evaluator: teacher._id,
        category: "product",
        score: 9,
        comment: "Genuinely impressive work",
      });
      const fromClassmate = await TeamEvaluation.create({
        project: project._id,
        team: team._id,
        evaluator: classmate._id,
        category: "presentation",
        score: 7,
        comment: "Clear and well rehearsed",
      });
      await publish(team._id, [fromTeacher._id, fromClassmate._id]);

      const detail = await getShowcaseTeam(team._id.toString());
      expect(detail?.team.quotes).toEqual([
        {
          comment: "Genuinely impressive work",
          attribution: `${teacher.name}, teacher`,
        },
        {
          comment: "Clear and well rehearsed",
          attribution: "Another student",
        },
      ]);
      // No score, and no classmate's name, anywhere in what is served.
      const payload = JSON.stringify(detail);
      expect(payload).not.toContain(classmate.name);
      expect(payload).not.toContain("score");
      expect(member.name).toBeTruthy();
    });

    it("names a judge only after they have opted in", async () => {
      const { project, team, teacher } = await quoteSetup();
      const judge = await JudgeInvitation.create({
        project: project._id,
        name: "Judge Judy",
        focus: "all",
        token: "judge-token-for-showcase-test",
        createdBy: teacher._id,
      });
      const fromJudge = await TeamEvaluation.create({
        project: project._id,
        team: team._id,
        judge: judge._id,
        category: "product",
        score: 8,
        comment: "I would hire this team",
      });
      await publish(team._id, [fromJudge._id]);

      const anonymous = await getShowcaseTeam(team._id.toString());
      expect(anonymous?.team.quotes[0].attribution).toBe("An industry judge");

      await JudgeInvitation.updateOne(
        { _id: judge._id },
        { showcaseNameConsent: true }
      );
      const named = await getShowcaseTeam(team._id.toString());
      expect(named?.team.quotes[0].attribution).toBe(
        "Judge Judy, industry judge"
      );
    });

    it("drops a quote whose comment is gone, without touching the team's list", async () => {
      const { project, team, teacher } = await quoteSetup();
      const evaluation = await TeamEvaluation.create({
        project: project._id,
        team: team._id,
        evaluator: teacher._id,
        category: "product",
        score: 9,
        comment: "Was worth quoting",
      });
      await publish(team._id, [evaluation._id]);
      await TeamEvaluation.updateOne({ _id: evaluation._id }, { comment: "" });

      const detail = await getShowcaseTeam(team._id.toString());
      expect(detail?.team.quotes).toEqual([]);
      const stored = await Team.findById(team._id).lean<{
        showcaseQuotes: unknown[];
      } | null>();
      expect(stored?.showcaseQuotes).toHaveLength(1);
    });
  });
});
