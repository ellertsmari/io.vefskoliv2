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
import { Guide } from "models/guide";
import { ExerciseAttempt } from "models/exerciseAttempt";
import {
  getExerciseSummary,
  startExercise,
  checkAnswer,
  finishExercise,
} from "serverActions/exerciseSession";
import type { UserDocument } from "models/user";

jest.mock("../../auth", () => ({ auth: jest.fn() }));
jest.mock("serverActions/mongoose-connector", () => ({
  connectToDatabase: jest.fn(),
}));

const mockedAuth = auth as unknown as jest.Mock;

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
      tasks: [
        {
          type: "quiz",
          prompt: "Pick A",
          options: ["A", "B"],
          correctAnswers: [0],
          points: 1,
          explanation: "A is right",
        },
        {
          type: "quiz",
          prompt: "Pick B",
          options: ["A", "B"],
          correctAnswers: [1],
          points: 1,
        },
      ],
    },
  });

describe("exercise session", () => {
  let student: UserDocument;
  let guideId: string;

  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());

  beforeEach(async () => {
    await clearDatabase();
    student = await createDummyUser();
    mockedAuth.mockResolvedValue({ user: { id: student._id.toString() } });
    const guide = await guideWithExercise();
    guideId = guide._id.toString();
  });

  /**
   * Opening the exercise creates the attempt row. Counting rows told a student
   * they were "part way through" and promised their answers were saved, with
   * nothing answered.
   */
  it("does not report progress just because the exercise was opened", async () => {
    expect((await getExerciseSummary(guideId))?.status).toBe("notStarted");

    const started = await startExercise(guideId);
    expect(started.success).toBe(true);

    const summary = await getExerciseSummary(guideId);
    expect(summary?.status).toBe("notStarted");
    expect(summary?.answered).toBe(0);
  });

  it("reports progress once a question has actually been tried", async () => {
    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");
    const firstTask = started.data.exercise.tasks[0];

    await checkAnswer({ guideId, taskId: firstTask.id, answer: [1] });

    const summary = await getExerciseSummary(guideId);
    expect(summary?.status).toBe("inProgress");
    expect(summary?.answered).toBe(1);
  });

  it("scores first-try answers and not later ones", async () => {
    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");
    const [one, two] = started.data.exercise.tasks;

    // First question: wrong, then right — earns nothing.
    const wrong = await checkAnswer({ guideId, taskId: one.id, answer: [1] });
    expect(wrong.success && wrong.data.status).toBe("incorrect");
    const retry = await checkAnswer({ guideId, taskId: one.id, answer: [0] });
    expect(retry.success && retry.data.status).toBe("correct");

    // Second question: right first time — earns its point.
    await checkAnswer({ guideId, taskId: two.id, answer: [1] });

    const finished = await finishExercise(guideId);
    if (!finished.success) throw new Error("could not finish");
    expect(finished.data.earnedPoints).toBe(1);
    expect(finished.data.totalPoints).toBe(2);
    expect(finished.data.score).toBe(5);
    expect(finished.data.perfect).toBe(false);
  });

  it("reports a perfect score when everything was right first time", async () => {
    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");
    const [one, two] = started.data.exercise.tasks;
    await checkAnswer({ guideId, taskId: one.id, answer: [0] });
    await checkAnswer({ guideId, taskId: two.id, answer: [1] });

    const finished = await finishExercise(guideId);
    expect(finished.success && finished.data.perfect).toBe(true);
    expect((await getExerciseSummary(guideId))?.status).toBe("perfect");
  });

  it("re-checking an answer already right does not cost another try", async () => {
    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");
    const one = started.data.exercise.tasks[0];

    await checkAnswer({ guideId, taskId: one.id, answer: [0] });
    const again = await checkAnswer({ guideId, taskId: one.id, answer: [0] });
    expect(again.success && again.data.tries).toBe(1);

    const finished = await finishExercise(guideId);
    // still counts as first-try correct
    expect(finished.success && finished.data.earnedPoints).toBe(1);
  });

  it("starts a fresh attempt after finishing, and resumes an unfinished one", async () => {
    const first = await startExercise(guideId);
    if (!first.success) throw new Error("could not start");
    expect(first.data.attemptNumber).toBe(1);

    await checkAnswer({
      guideId,
      taskId: first.data.exercise.tasks[0].id,
      answer: [0],
    });

    // Re-opening without finishing resumes the same attempt, answers intact.
    const resumed = await startExercise(guideId);
    if (!resumed.success) throw new Error("could not resume");
    expect(resumed.data.attemptNumber).toBe(1);
    expect(Object.keys(resumed.data.progress)).toHaveLength(1);

    await finishExercise(guideId);

    const second = await startExercise(guideId);
    if (!second.success) throw new Error("could not start again");
    expect(second.data.attemptNumber).toBe(2);
    expect(second.data.progress).toEqual({});
  });

  it("refuses an answer to a question outside the attempt", async () => {
    await startExercise(guideId);
    const res = await checkAnswer({
      guideId,
      taskId: "000000000000000000000000",
      answer: [0],
    });
    expect(res.success).toBe(false);
  });

  it("refuses to answer before the exercise is started", async () => {
    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");
    const taskIdToUse = started.data.exercise.tasks[0].id;
    await ExerciseAttempt.deleteMany({});

    const res = await checkAnswer({ guideId, taskId: taskIdToUse, answer: [0] });
    expect(res.success).toBe(false);
  });

  /**
   * A generic hint answers a question the student did not ask: telling someone
   * who picked "0" that an empty array is truthy explains the wrong thing.
   */
  it("explains the option the student actually picked, and only that one", async () => {
    const guide = await Guide.findById(guideId);
    guide!.set("exercise.tasks.0.optionFeedback", [
      null,
      "B is wrong because of reasons specific to B",
    ]);
    await guide!.save();

    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");
    const one = started.data.exercise.tasks[0];

    const res = await checkAnswer({ guideId, taskId: one.id, answer: [1] });
    if (!res.success) throw new Error("check failed");
    expect(res.data.optionNotes).toEqual([
      "B is wrong because of reasons specific to B",
    ]);
  });

  it("never sends option notes for options that were not picked", async () => {
    const guide = await Guide.findById(guideId);
    guide!.set("exercise.tasks.0.optionFeedback", [
      "note about the CORRECT option",
      "note about the wrong one",
    ]);
    await guide!.save();

    const started = await startExercise(guideId);
    if (!started.success) throw new Error("could not start");

    // Nothing about the options travels before an answer is given...
    expect(JSON.stringify(started)).not.toContain("note about");

    // ...and picking the wrong one reveals only its own note.
    const res = await checkAnswer({
      guideId,
      taskId: started.data.exercise.tasks[0].id,
      answer: [1],
    });
    const serialized = JSON.stringify(res);
    expect(serialized).toContain("note about the wrong one");
    expect(serialized).not.toContain("note about the CORRECT option");
  });

  it("never sends the answer key to the client", async () => {
    const started = await startExercise(guideId);
    const serialized = JSON.stringify(started);
    expect(serialized).not.toContain("correctAnswers");
    expect(serialized).not.toContain("A is right");
  });
});
