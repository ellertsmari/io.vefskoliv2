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
import { ObjectId } from "mongodb";
import { Guide } from "models/guide";
import { ExerciseAttempt } from "models/exerciseAttempt";
import {
  getExerciseSummary,
  openExercise,
  checkAnswer,
  newQuestion,
  type OpenedExercise,
} from "serverActions/exerciseSession";
import { getGuides } from "serverActions/getGuides";
import { extendGuides } from "utils/guideUtils";
import { ReturnStatus } from "types/guideTypes";
import type { UserDocument } from "models/user";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const mockedAuth = auth as unknown as jest.Mock;

const RIGHT = [0];
const WRONG = [1];

/**
 * Four multiple-choice questions, two served at a time, and one short answer.
 * Every quiz question has the same right option, so a test does not need to
 * know which two the pool drew.
 */
const quizTask = (n: number) => ({
  type: "quiz",
  prompt: `Question ${n}`,
  options: ["right", "wrong"],
  correctAnswers: [0],
  points: 1,
  explanation: "Because it is right",
  goal: "Understand things",
});

const guideWithExercise = async () =>
  Guide.create({
    category: "code",
    title: "Test guide",
    description: "d",
    createdAt: new Date(),
    updatedAt: new Date(),
    themeIdea: { title: "t", description: "d" },
    topicsList: "t",
    module: { title: "3 - The fundamentals", number: 3 },
    order: 0,
    knowledge: [],
    skills: [],
    resources: [],
    references: [],
    classes: [],
    gradingMode: "auto",
    exercise: {
      passThreshold: 0.7,
      poolSizes: { quiz: 2 },
      tasks: [
        quizTask(1),
        quizTask(2),
        quizTask(3),
        quizTask(4),
        {
          type: "shortAnswer",
          prompt: "Which keyword declares a constant?",
          acceptedAnswers: ["const"],
          points: 1,
          hint: "It is short for constant",
        },
      ],
    },
  });

const open = async (guideId: string): Promise<OpenedExercise> => {
  const res = await openExercise(guideId);
  if (!res.success) throw new Error(res.message);
  return res.data;
};

const quizIds = (opened: OpenedExercise) =>
  opened.exercise.tasks.filter((t) => t.type === "quiz").map((t) => t.id);

const shortId = (opened: OpenedExercise) =>
  opened.exercise.tasks.find((t) => t.type === "shortAnswer")!.id;

describe("exercise session", () => {
  let student: UserDocument;
  let guideId: string;

  beforeAll(async () => {
    await connect();
    // The one-active-attempt guarantee is a unique index; build it.
    await ExerciseAttempt.syncIndexes();
  });
  afterAll(async () => await closeDatabase());

  beforeEach(async () => {
    await clearDatabase();
    student = await createDummyUser();
    mockedAuth.mockResolvedValue({ user: { id: student._id.toString() } });
    guideId = (await guideWithExercise())._id.toString();
  });

  const guideStatus = async () => {
    const guides = await getGuides(student._id.toString());
    const guide = extendGuides(guides ?? []).find(
      (g) => g._id.toString() === guideId
    );
    return { status: guide?.returnStatus, grade: guide?.grade };
  };

  describe("one attempt that never closes", () => {
    it("creates nothing for a student who has only looked at the guide", async () => {
      const summary = await getExerciseSummary(guideId);
      expect(summary).toMatchObject({ status: "notStarted", score: null, total: 3 });
      expect(await ExerciseAttempt.countDocuments({})).toBe(0);
    });

    it("keeps the same questions and answers every time it is opened", async () => {
      const first = await open(guideId);
      await checkAnswer({ guideId, taskId: quizIds(first)[0], answer: RIGHT });

      const again = await open(guideId);
      expect(again.exercise.tasks.map((t) => t.id)).toEqual(
        first.exercise.tasks.map((t) => t.id)
      );
      expect(again.items[quizIds(first)[0]]).toMatchObject({
        status: "correct",
        lastAnswer: RIGHT,
      });
      expect(await ExerciseAttempt.countDocuments({})).toBe(1);
    });

    it("never creates two attempts, however many opens race", async () => {
      await Promise.all([open(guideId), open(guideId), open(guideId)]);
      expect(await ExerciseAttempt.countDocuments({ status: "active" })).toBe(1);
    });

    it("is not started just because it was opened", async () => {
      await open(guideId);
      expect((await getExerciseSummary(guideId))?.status).toBe("notStarted");
      expect(await guideStatus()).toEqual({
        status: ReturnStatus.NOT_RETURNED,
        grade: undefined,
      });
    });
  });

  describe("multiple choice", () => {
    it("scores a right first guess in full, and explains it", async () => {
      const opened = await open(guideId);
      const res = await checkAnswer({ guideId, taskId: quizIds(opened)[0], answer: RIGHT });
      if (!res.success) throw new Error(res.message);
      expect(res.data.item).toMatchObject({
        status: "correct",
        earned: 1,
        explanation: "Because it is right",
      });
    });

    it("locks a question on a wrong guess and reveals the answer", async () => {
      const opened = await open(guideId);
      const id = quizIds(opened)[0];
      const res = await checkAnswer({ guideId, taskId: id, answer: WRONG });
      if (!res.success) throw new Error(res.message);
      expect(res.data.item).toMatchObject({
        status: "locked",
        worth: 0.5,
        canReplace: true,
        reveal: { correctAnswers: [0], explanation: "Because it is right" },
      });

      // One guess: no second go at a locked question.
      const again = await checkAnswer({ guideId, taskId: id, answer: RIGHT });
      expect(again.success).toBe(false);
    });

    it("offers a new question worth half, and scores it at half", async () => {
      const opened = await open(guideId);
      const locked = quizIds(opened)[0];
      await checkAnswer({ guideId, taskId: locked, answer: WRONG });

      const swapped = await newQuestion({ guideId, taskId: locked });
      if (!swapped.success) throw new Error(swapped.message);
      const next = swapped.data.task;
      expect(quizIds(opened)).not.toContain(next.id);
      expect(swapped.data.item).toMatchObject({ status: "open", worth: 0.5 });
      // Nothing of the new question's key travels with it.
      expect(JSON.stringify(swapped)).not.toContain("correctAnswers");

      const res = await checkAnswer({ guideId, taskId: next.id, answer: RIGHT });
      expect(res.success && res.data.item).toMatchObject({
        status: "correct",
        earned: 0.5,
      });

      // The replacement takes the locked question's place for good.
      const reopened = await open(guideId);
      expect(reopened.exercise.tasks.map((t) => t.id)).toContain(next.id);
      expect(reopened.exercise.tasks.map((t) => t.id)).not.toContain(locked);
    });

    it("only swaps a question that is locked", async () => {
      const opened = await open(guideId);
      const res = await newQuestion({ guideId, taskId: quizIds(opened)[0] });
      expect(res.success).toBe(false);
    });

    it("says so when the pool is used up", async () => {
      const opened = await open(guideId);
      let id = quizIds(opened)[0];
      // Two served, four in the pool: this slot can hold the other two.
      for (let i = 0; i < 2; i++) {
        await checkAnswer({ guideId, taskId: id, answer: WRONG });
        const swapped = await newQuestion({ guideId, taskId: id });
        if (!swapped.success) throw new Error(swapped.message);
        id = swapped.data.task.id;
      }
      const last = await checkAnswer({ guideId, taskId: id, answer: WRONG });
      expect(last.success && last.data.item).toMatchObject({
        status: "locked",
        worth: 0.125,
        canReplace: false,
      });
      expect((await newQuestion({ guideId, taskId: id })).success).toBe(false);
    });

    it("refuses a question that is not on show", async () => {
      await open(guideId);
      const res = await checkAnswer({
        guideId,
        taskId: new ObjectId().toString(),
        answer: RIGHT,
      });
      expect(res.success).toBe(false);
    });

    it("refuses an answer before the exercise is opened", async () => {
      const res = await checkAnswer({ guideId, taskId: "x", answer: RIGHT });
      expect(res.success).toBe(false);
    });
  });

  describe("short answers", () => {
    it("halves what each try is worth after a wrong one", async () => {
      const opened = await open(guideId);
      const id = shortId(opened);

      const wrong = await checkAnswer({ guideId, taskId: id, answer: "var" });
      expect(wrong.success && wrong.data).toMatchObject({
        item: { status: "tried", worth: 0.5 },
        hint: "It is short for constant",
      });

      const right = await checkAnswer({ guideId, taskId: id, answer: "const" });
      expect(right.success && right.data.item).toMatchObject({
        status: "correct",
        earned: 0.5,
      });
    });
  });

  describe("the grade", () => {
    it("is in progress under the pass mark and passes the moment it reaches it", async () => {
      const opened = await open(guideId);
      const [one, two] = quizIds(opened);

      await checkAnswer({ guideId, taskId: one, answer: RIGHT });
      // 1 of 3.
      expect(await guideStatus()).toEqual({
        status: ReturnStatus.IN_PROGRESS,
        grade: 3.3,
      });
      expect((await getExerciseSummary(guideId))?.status).toBe("inProgress");

      await checkAnswer({ guideId, taskId: two, answer: RIGHT });
      // 2 of 3 — still under 70%.
      expect((await guideStatus()).status).toBe(ReturnStatus.IN_PROGRESS);

      await checkAnswer({ guideId, taskId: shortId(opened), answer: "const" });
      expect(await guideStatus()).toEqual({
        status: ReturnStatus.PASSED,
        grade: 10,
      });
      expect((await getExerciseSummary(guideId))?.status).toBe("perfect");
    });

    it("follows the pass mark if the teacher changes it", async () => {
      const opened = await open(guideId);
      await checkAnswer({ guideId, taskId: quizIds(opened)[0], answer: RIGHT });
      await checkAnswer({ guideId, taskId: quizIds(opened)[1], answer: RIGHT });
      expect((await getExerciseSummary(guideId))?.passed).toBe(false);

      await Guide.updateOne(
        { _id: new ObjectId(guideId) },
        { $set: { "exercise.passThreshold": 0.5 } }
      );
      expect((await getExerciseSummary(guideId))?.passed).toBe(true);
      expect((await ExerciseAttempt.findOne({ status: "active" }))?.passed).toBe(true);
    });
  });

  /**
   * Students who worked under the old numbered attempts keep everything they
   * got right in any of them, at full points, and the rest is open again.
   */
  describe("merging old attempts", () => {
    const legacyAttempt = async (
      attemptNumber: number,
      answers: Record<string, unknown>,
      taskProgress: Record<string, unknown>,
      status = "submitted"
    ) =>
      ExerciseAttempt.create({
        guide: new ObjectId(guideId),
        owner: student._id,
        attemptNumber,
        status,
        answers,
        taskProgress,
        score: 0,
        passed: false,
      });

    const ids = async () => {
      const guide = (await Guide.findById(guideId).lean()) as unknown as {
        exercise: { tasks: { _id: ObjectId }[] };
      };
      return guide.exercise.tasks.map((t) =>
        t._id.toString()
      );
    };

    const progress = (tries: number, correct: boolean) => ({
      tries,
      correct,
      firstTryCorrect: correct && tries === 1,
      skipped: false,
    });

    it("folds them into one attempt with the amnesty, the first time guides load", async () => {
      const [q1, q2, , , s] = await ids();
      // Attempt 1: q1 right on the third try (worth 0 under the old rule).
      await legacyAttempt(1, { [q1]: RIGHT }, { [q1]: progress(3, true) });
      // Attempt 2: q2 right first time, the short answer right on a second try.
      await legacyAttempt(
        2,
        { [q2]: RIGHT, [s]: "const" },
        { [q2]: progress(1, true), [s]: progress(2, true) }
      );

      expect(await guideStatus()).toEqual({
        status: ReturnStatus.PASSED,
        grade: 10,
      });
      expect(await ExerciseAttempt.countDocuments({ status: "merged" })).toBe(2);
      expect(await ExerciseAttempt.countDocuments({ status: "active" })).toBe(1);

      const opened = await open(guideId);
      expect(Object.values(opened.items).every((i) => i.status === "correct")).toBe(true);
    });

    it("reopens questions never got right, at full value", async () => {
      const [q1, q2] = await ids();
      await legacyAttempt(
        1,
        { [q1]: RIGHT, [q2]: WRONG },
        { [q1]: progress(1, true), [q2]: progress(5, false) }
      );

      const opened = await open(guideId);
      expect(opened.items[q1]).toMatchObject({ status: "correct", earned: 1 });
      expect(opened.items[q2]).toMatchObject({ status: "open", worth: 1 });
      expect((await getExerciseSummary(guideId))?.status).toBe("inProgress");
    });

    it("merges an old unfinished attempt too, so nothing answered is lost", async () => {
      const [q1] = await ids();
      await legacyAttempt(1, { [q1]: RIGHT }, { [q1]: progress(1, true) }, "inProgress");

      const summary = await getExerciseSummary(guideId);
      expect(summary).toMatchObject({ status: "inProgress", answered: 1 });
      expect(await ExerciseAttempt.countDocuments({ status: "inProgress" })).toBe(0);
    });
  });

  describe("what reaches the browser", () => {
    it("never sends the answer key before a question is locked", async () => {
      const opened = await open(guideId);
      const serialized = JSON.stringify(opened);
      expect(serialized).not.toContain("correctAnswers");
      expect(serialized).not.toContain("Because it is right");
      expect(serialized).not.toContain("acceptedAnswers");
    });

    /**
     * A generic hint answers a question the student did not ask: telling
     * someone who picked "0" that an empty array is truthy explains the
     * wrong thing.
     */
    it("explains only the option the student actually picked", async () => {
      const guide = await Guide.findById(guideId);
      for (let i = 0; i < 4; i++) {
        guide!.set(`exercise.tasks.${i}.optionFeedback`, [
          "note about the RIGHT option",
          "note about the wrong one",
        ]);
      }
      await guide!.save();

      const opened = await open(guideId);
      expect(JSON.stringify(opened)).not.toContain("note about");

      const res = await checkAnswer({ guideId, taskId: quizIds(opened)[0], answer: WRONG });
      if (!res.success) throw new Error(res.message);
      expect(res.data.answerNotes).toEqual(["note about the wrong one"]);
      expect(JSON.stringify(res)).not.toContain("note about the RIGHT option");
    });

    it("explains an anticipated wrong answer that was typed", async () => {
      const guide = await Guide.findById(guideId);
      guide!.set("exercise.tasks.4.answerFeedback", [
        { match: "let", note: "`let` can be reassigned; a constant cannot." },
      ]);
      await guide!.save();

      const opened = await open(guideId);
      expect(JSON.stringify(opened)).not.toContain("can be reassigned");

      const wrong = await checkAnswer({ guideId, taskId: shortId(opened), answer: "let" });
      expect(wrong.success && wrong.data.answerNotes).toEqual([
        "`let` can be reassigned; a constant cannot.",
      ]);

      // An answer nobody anticipated gets no note rather than a wrong one.
      const other = await checkAnswer({ guideId, taskId: shortId(opened), answer: "fixed" });
      expect(other.success && other.data.answerNotes).toBeUndefined();
    });
  });
});
