import {
  gradeExercise,
  gradeTask,
  computeExerciseAnalytics,
  sanitizeExerciseForClient,
  sanitizeGuideForClient,
  ExerciseGradingError,
  type AttemptForAnalytics,
  type ServerExercise,
} from "utils/exerciseUtils";
import { ExerciseTaskType } from "types/guideTypes";

const makeExercise = (overrides?: Partial<ServerExercise>): ServerExercise => ({
  passThreshold: 0.7,
  tasks: [
    {
      id: "t1",
      type: "quiz",
      prompt: "Pick A",
      options: ["A", "B", "C"],
      allowMultiple: false,
      points: 1,
      correctAnswers: [0],
      explanation: "A is correct",
      hint: "Re-read the section on letters",
      goal: "Understand letters",
    },
    {
      id: "t2",
      type: "quiz",
      prompt: "Pick A and C",
      options: ["A", "B", "C"],
      allowMultiple: true,
      points: 1,
      correctAnswers: [0, 2],
      goal: "Understand combinations",
    },
  ],
  ...overrides,
});

describe("gradeExercise", () => {
  it("gives a perfect score when all tasks are correct", () => {
    const result = gradeExercise(makeExercise(), { t1: [0], t2: [0, 2] });
    expect(result.score).toBe(10);
    expect(result.passed).toBe(true);
    expect(result.earnedPoints).toBe(2);
    expect(result.totalPoints).toBe(2);
  });

  it("is order-independent for multi-select answers", () => {
    const result = gradeExercise(makeExercise(), { t1: [0], t2: [2, 0] });
    expect(result.results.find((r) => r.taskId === "t2")?.correct).toBe(true);
  });

  it("gives partial credit on multi-select: half the right answers, half the points", () => {
    // t2 key is [0,2]; selecting only [0] = (1 correct - 0 wrong) / 2 = 0.5 points
    const result = gradeExercise(makeExercise(), { t1: [0], t2: [0] });
    const t2 = result.results.find((r) => r.taskId === "t2");
    expect(t2?.correct).toBe(false);
    expect(t2?.pointsEarned).toBe(0.5);
    expect(result.score).toBe(7.5); // 1.5 of 2 points
  });

  it("penalizes wrong selections so select-everything earns nothing extra", () => {
    // [0,1,2] against key [0,2] = (2 correct - 1 wrong) / 2 = 0.5 points
    const everything = gradeExercise(makeExercise(), { t1: [0], t2: [0, 1, 2] });
    expect(
      everything.results.find((r) => r.taskId === "t2")?.pointsEarned
    ).toBe(0.5);

    // all wrong selections floor at zero, never negative
    const wrong = gradeExercise(makeExercise(), { t1: [0], t2: [1] });
    expect(wrong.results.find((r) => r.taskId === "t2")?.pointsEarned).toBe(0);
  });

  it("treats a partially correct multi-select as not fully correct (hint, not explanation)", () => {
    const exercise = makeExercise();
    exercise.tasks[1].hint = "Think about which combinations work";
    const result = gradeExercise(exercise, { t1: [0], t2: [0] });
    const t2 = result.results.find((r) => r.taskId === "t2");
    expect(t2?.explanation).toBeUndefined();
    expect(t2?.hint).toBe("Think about which combinations work");
  });

  it("scores 0 and does not pass when nothing is answered", () => {
    const result = gradeExercise(makeExercise(), {});
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it("respects the pass threshold", () => {
    // 1 of 2 correct = 50%, below the default 0.7
    const half = gradeExercise(makeExercise(), { t1: [0] });
    expect(half.passed).toBe(false);
    // lower the bar to 0.5 and the same answers now pass
    const lenient = gradeExercise(makeExercise({ passThreshold: 0.5 }), {
      t1: [0],
    });
    expect(lenient.passed).toBe(true);
  });

  it("reveals the explanation only when the answer is correct", () => {
    const graded = gradeExercise(makeExercise(), { t1: [0], t2: [0, 2] });
    const t1 = graded.results.find((r) => r.taskId === "t1");
    expect(t1?.explanation).toBe("A is correct");
    expect(t1?.hint).toBeUndefined();
  });

  it("reveals the hint (not the explanation) when the answer is wrong", () => {
    const graded = gradeExercise(makeExercise(), { t1: [1], t2: [0, 2] });
    const t1 = graded.results.find((r) => r.taskId === "t1");
    expect(t1?.correct).toBe(false);
    expect(t1?.explanation).toBeUndefined();
    expect(t1?.hint).toBe("Re-read the section on letters");
  });

  it("aggregates earned/total points per knowledge goal", () => {
    const result = gradeExercise(makeExercise(), { t1: [0], t2: [0] });
    expect(result.goalBreakdown).toEqual(
      expect.arrayContaining([
        { goal: "Understand letters", earnedPoints: 1, totalPoints: 1 },
        { goal: "Understand combinations", earnedPoints: 0.5, totalPoints: 1 },
      ])
    );
  });

  it("omits the goal breakdown when no task is tagged", () => {
    const exercise = makeExercise();
    exercise.tasks.forEach((t) => delete t.goal);
    const result = gradeExercise(exercise, { t1: [0], t2: [0, 2] });
    expect(result.goalBreakdown).toBeUndefined();
  });

  it("weights tasks by their points", () => {
    const exercise = makeExercise();
    exercise.tasks[0].points = 3; // t1 worth 3, t2 worth 1 => total 4
    const result = gradeExercise(exercise, { t1: [0] });
    expect(result.earnedPoints).toBe(3);
    expect(result.totalPoints).toBe(4);
    expect(result.score).toBe(7.5);
  });
});

describe("question pools", () => {
  const pooled = (): ServerExercise => ({
    ...makeExercise(),
    poolSize: 1,
  });

  it("serves a random subset of poolSize questions", () => {
    const rng = () => 0; // deterministic shuffle
    const sanitized = sanitizeExerciseForClient(pooled(), rng);
    expect(sanitized!.tasks).toHaveLength(1);
    expect(sanitized!.poolTotal).toBe(2);
  });

  it("does not pool when poolSize >= question count", () => {
    const exercise = { ...makeExercise(), poolSize: 5 };
    const sanitized = sanitizeExerciseForClient(exercise);
    expect(sanitized!.tasks).toHaveLength(2);
    expect(sanitized!.poolTotal).toBeUndefined();
  });

  it("grades a pooled submission against exactly the answered subset", () => {
    const result = gradeExercise(pooled(), { t1: [0] });
    expect(result.totalPoints).toBe(1);
    expect(result.score).toBe(10);
    expect(result.results).toHaveLength(1);
  });

  it("rejects pooled submissions with the wrong number of questions", () => {
    expect(() => gradeExercise(pooled(), { t1: [0], t2: [0, 2] })).toThrow(
      ExerciseGradingError
    );
    expect(() => gradeExercise(pooled(), {})).toThrow(ExerciseGradingError);
    // unknown task ids don't count toward the subset
    expect(() => gradeExercise(pooled(), { nonsense: [0] })).toThrow(
      ExerciseGradingError
    );
  });
});

describe("computeExerciseAnalytics", () => {
  const attempt = (
    owner: string,
    answers: Record<string, number[]>,
    score: number,
    passed: boolean
  ): AttemptForAnalytics => ({ owner, answers, score, passed });

  it("aggregates per-student bests and per-question correct rates", () => {
    const attempts = [
      attempt("alice", { t1: [1], t2: [0, 2] }, 5, false), // t1 wrong, t2 right
      attempt("alice", { t1: [0], t2: [0, 2] }, 10, true), // both right
      attempt("bob", { t1: [0], t2: [1] }, 5, false), // t1 right, t2 wrong
    ];
    const analytics = computeExerciseAnalytics(makeExercise(), attempts);

    expect(analytics.totalAttempts).toBe(3);
    expect(analytics.uniqueStudents).toBe(2);
    expect(analytics.studentPassRate).toBe(0.5); // alice passed, bob didn't
    expect(analytics.averageBestScore).toBe(7.5); // (10 + 5) / 2

    const t1 = analytics.taskStats.find((t) => t.taskId === "t1");
    expect(t1?.timesAnswered).toBe(3);
    expect(t1?.correctRate).toBeCloseTo(2 / 3, 2);
    expect(t1?.goal).toBe("Understand letters");

    const t2 = analytics.taskStats.find((t) => t.taskId === "t2");
    expect(t2?.correctRate).toBeCloseTo(2 / 3, 2);
  });

  it("handles a question nobody has answered yet (pooled out)", () => {
    const attempts = [attempt("alice", { t1: [0] }, 10, true)];
    const analytics = computeExerciseAnalytics(makeExercise(), attempts);
    const t2 = analytics.taskStats.find((t) => t.taskId === "t2");
    expect(t2?.timesAnswered).toBe(0);
    expect(t2?.correctRate).toBeNull();
  });

  it("returns empty aggregates for zero attempts", () => {
    const analytics = computeExerciseAnalytics(makeExercise(), []);
    expect(analytics.totalAttempts).toBe(0);
    expect(analytics.studentPassRate).toBeNull();
    expect(analytics.averageBestScore).toBeNull();
  });
});

describe("sanitizeExerciseForClient", () => {
  it("strips the answer key and explanations", () => {
    const sanitized = sanitizeExerciseForClient(makeExercise());
    expect(sanitized).toBeDefined();
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("correctAnswers");
    expect(serialized).not.toContain("A is correct");
    expect(serialized).not.toContain("Re-read the section on letters");
    expect(serialized).not.toContain("Understand letters"); // goal stays server-side
    expect(sanitized!.tasks[0]).not.toHaveProperty("correctAnswers");
    expect(sanitized!.tasks[0].id).toBe("t1");
    const first = sanitized!.tasks[0];
    expect(first.type).toBe(ExerciseTaskType.QUIZ);
    if (first.type === ExerciseTaskType.QUIZ) {
      expect(first.options).toEqual(["A", "B", "C"]);
    }
  });

  it("returns undefined when there is no exercise", () => {
    expect(sanitizeExerciseForClient(undefined)).toBeUndefined();
    expect(sanitizeExerciseForClient(null)).toBeUndefined();
  });
});

describe("sanitizeGuideForClient", () => {
  it("replaces the raw exercise with a sanitized one and keeps other fields", () => {
    const guide = { title: "Quiz guide", gradingMode: "auto", exercise: makeExercise() };
    const sanitized = sanitizeGuideForClient(guide);
    expect(sanitized.title).toBe("Quiz guide");
    expect(JSON.stringify(sanitized)).not.toContain("correctAnswers");
    expect(sanitized.exercise?.tasks).toHaveLength(2);
  });

  it("leaves a non-exercise guide's exercise undefined", () => {
    const guide = { title: "Normal guide" };
    const sanitized = sanitizeGuideForClient(guide);
    expect(sanitized.exercise).toBeUndefined();
    expect(sanitized.title).toBe("Normal guide");
  });
});

describe("code tasks", () => {
  const codeExercise = (): ServerExercise => ({
    passThreshold: 0.7,
    tasks: [
      {
        id: "c1",
        type: "code",
        prompt: "Sum the kids",
        points: 10,
        entryPoint: "totalKids",
        tests: [{ args: [[]], expected: 0 }],
        requires: ["iteration"],
      } as never,
    ],
  });

  /** What the runner would have produced, as stored on the attempt. */
  const feedback = (
    testsPassed: number,
    testsTotal: number,
    constructsMet: boolean
  ) => ({
    compiled: true,
    typeErrors: [],
    tests: [],
    testsPassed,
    testsTotal,
    constructsMet,
    missingConstructs: constructsMet ? [] : ["iteration"],
  });

  it("gives full marks when every test passes and the construct was used", () => {
    const result = gradeExercise(
      codeExercise(),
      { c1: "code" },
      { c1: feedback(4, 4, true) as never }
    );
    expect(result.score).toBe(10);
    expect(result.results[0].correct).toBe(true);
  });

  it("gives partial credit per passing test", () => {
    // 3 of 4 tests = 0.75 of the 80% carried by tests, plus the full 20%
    const result = gradeExercise(
      codeExercise(),
      { c1: "code" },
      { c1: feedback(3, 4, true) as never }
    );
    expect(result.earnedPoints).toBe(8);
    expect(result.results[0].correct).toBe(false);
  });

  it("costs a slice, not everything, when the construct is missing", () => {
    // All tests pass but no iteration: keeps the 80%, loses the 20%.
    const result = gradeExercise(
      codeExercise(),
      { c1: "code" },
      { c1: feedback(4, 4, false) as never }
    );
    expect(result.earnedPoints).toBe(8);
    expect(result.score).toBe(8);
    // A working .reduce() solution is still a strong score, never a zero.
    expect(result.earnedPoints).toBeGreaterThan(0);
  });

  it("lets tests carry the whole task when nothing is required", () => {
    const exercise = codeExercise();
    delete (exercise.tasks[0] as never as { requires?: unknown }).requires;
    const result = gradeExercise(
      exercise,
      { c1: "code" },
      { c1: feedback(2, 4, false) as never }
    );
    expect(result.earnedPoints).toBe(5); // half the tests, half the marks
  });

  it("scores zero rather than guessing when the code never ran", () => {
    const result = gradeExercise(codeExercise(), { c1: "code" });
    expect(result.earnedPoints).toBe(0);
    expect(result.results[0].correct).toBe(false);
  });

  it("never sends the test cases' expected values to the client", () => {
    const serialized = JSON.stringify(
      sanitizeExerciseForClient(codeExercise())
    );
    expect(serialized).not.toContain("acceptedAnswers");
    expect(serialized).toContain("totalKids");
  });

  it("shows a hidden test by label only", () => {
    const exercise = codeExercise();
    (exercise.tasks[0] as never as { tests: unknown[] }).tests = [
      { label: "visible", args: [[1]], expected: 1 },
      { label: "secret", args: [[9]], expected: 9, hidden: true },
    ];
    const task = sanitizeExerciseForClient(exercise)!.tasks[0];
    if (task.type !== ExerciseTaskType.CODE) throw new Error("wrong type");
    expect(task.tests[0]).toEqual({
      label: "visible",
      hidden: false,
      args: "[[1]]",
      expected: "1",
    });
    expect(task.tests[1]).toEqual({ label: "secret", hidden: true });
    expect(JSON.stringify(task.tests[1])).not.toContain("9");
  });
});

describe("short-answer tasks", () => {
  const shortAnswerExercise = (): ServerExercise => ({
    passThreshold: 0.7,
    tasks: [
      {
        id: "s1",
        type: "shortAnswer",
        prompt: "Which keyword declares a value that cannot be reassigned?",
        points: 1,
        acceptedAnswers: ["const"],
        explanation: "const binds the name, not the value",
        hint: "Re-read the section on declarations",
        goal: "Understand declarations",
      } as never,
    ],
  });

  it("scores an accepted answer and reveals the explanation", () => {
    const result = gradeExercise(shortAnswerExercise(), { s1: "const" });
    expect(result.score).toBe(10);
    expect(result.passed).toBe(true);
    expect(result.pendingCount).toBe(0);
    expect(result.results[0].status).toBe("correct");
    expect(result.results[0].explanation).toBe(
      "const binds the name, not the value"
    );
  });

  it("scores a wrong answer zero and gives the hint", () => {
    const result = gradeExercise(shortAnswerExercise(), { s1: "let" });
    expect(result.score).toBe(0);
    expect(result.results[0].status).toBe("incorrect");
    expect(result.results[0].hint).toBe("Re-read the section on declarations");
  });

  it("holds a near miss, earning nothing yet and withholding the hint", () => {
    const result = gradeExercise(shortAnswerExercise(), { s1: "konst" });
    expect(result.results[0].status).toBe("pending");
    expect(result.pendingCount).toBe(1);
    expect(result.results[0].pointsEarned).toBe(0);
    // Neither is revealed: the hint would imply it was wrong, and that is
    // exactly what has not been decided yet.
    expect(result.results[0].hint).toBeUndefined();
    expect(result.results[0].explanation).toBeUndefined();
  });

  it("counts a held answer in the total, so the score is a floor that can only rise", () => {
    const result = gradeExercise(shortAnswerExercise(), { s1: "konst" });
    expect(result.earnedPoints).toBe(0);
    expect(result.totalPoints).toBe(1);
    expect(result.passed).toBe(false);
  });

  it("never leaks the accepted answers or the pattern to the client", () => {
    const exercise = shortAnswerExercise();
    (exercise.tasks[0] as never as { pattern: string }).pattern = "^const$";
    const serialized = JSON.stringify(sanitizeExerciseForClient(exercise));
    expect(serialized).not.toContain("acceptedAnswers");
    expect(serialized).not.toContain("const");
    expect(serialized).not.toContain("pattern");
  });

  it("mixes with quiz tasks in one exercise", () => {
    const mixed: ServerExercise = {
      passThreshold: 0.5,
      tasks: [...makeExercise().tasks, ...shortAnswerExercise().tasks],
    };
    const result = gradeExercise(mixed, { t1: [0], t2: [0, 2], s1: "const" });
    expect(result.totalPoints).toBe(3);
    expect(result.score).toBe(10);
    expect(sanitizeExerciseForClient(mixed)?.tasks).toHaveLength(3);
  });
});

/**
 * Guides are hand-edited in the database, so an exercise can hold a task type
 * this build does not implement — a typo, or one authored ahead of its phase.
 * Such a task must never be shown to a student, never leak its fields, and
 * never be silently scored.
 */
describe("tasks of an unsupported type", () => {
  const withUnknownTask = (): ServerExercise =>
    makeExercise({
      tasks: [
        ...makeExercise().tasks,
        {
          // A type this build does not implement: a typo, or one authored
          // ahead of the phase that adds it.
          id: "t3",
          type: "diagram",
          prompt: "Draw the request flow",
          points: 5,
          // fields such a task would carry — must not reach a student
          solution: "browser -> server -> database",
        } as never,
      ],
    });

  it("is not served to the student", () => {
    const sanitized = sanitizeExerciseForClient(withUnknownTask());
    expect(sanitized?.tasks).toHaveLength(2);
    expect(sanitized?.tasks.map((t) => t.id)).toEqual(["t1", "t2"]);
  });

  it("does not leak its fields to the client", () => {
    const sanitized = sanitizeExerciseForClient(withUnknownTask());
    expect(JSON.stringify(sanitized)).not.toContain("solution");
    expect(JSON.stringify(sanitized)).not.toContain("reduce");
  });

  it("is excluded from the pool, so a pooled exercise still serves poolSize questions", () => {
    const exercise = withUnknownTask();
    exercise.poolSize = 1;
    const sanitized = sanitizeExerciseForClient(exercise, () => 0.99);
    expect(sanitized?.tasks).toHaveLength(1);
    expect(sanitized?.poolTotal).toBe(2); // the two gradeable tasks, not three
  });

  it("throws rather than scoring zero if one is somehow submitted", () => {
    const exercise = withUnknownTask();
    expect(() => gradeTask(exercise.tasks[2], [])).toThrow(
      ExerciseGradingError
    );
  });

  it("is skipped by analytics instead of throwing", () => {
    const attempts: AttemptForAnalytics[] = [
      { owner: "u1", answers: { t1: [0], t2: [0, 2] }, score: 10, passed: true },
    ];
    const analytics = computeExerciseAnalytics(withUnknownTask(), attempts);
    expect(analytics.taskStats).toHaveLength(2);
    expect(analytics.uniqueStudents).toBe(1);
  });

  it("grades the rest of the exercise normally", () => {
    const result = gradeExercise(withUnknownTask(), { t1: [0], t2: [0, 2] });
    expect(result.score).toBe(10);
    expect(result.totalPoints).toBe(2);
  });
});
