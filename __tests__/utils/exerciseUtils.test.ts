import {
  gradeTask,
  computeExerciseAnalytics,
  sanitizeExerciseForClient,
  sanitizeGuideForClient,
  ExerciseGradingError,
  seededRng,
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

describe("question pools", () => {
  const pooled = (): ServerExercise => ({
    ...makeExercise(),
    poolSizes: { quiz: 1 },
  });

  it("serves a random subset of the pool size", () => {
    const rng = () => 0; // deterministic shuffle
    const sanitized = sanitizeExerciseForClient(pooled(), rng);
    expect(sanitized!.tasks).toHaveLength(1);
    expect(sanitized!.pools).toEqual([
      { type: ExerciseTaskType.QUIZ, served: 1, total: 2 },
    ]);
  });

  it("reads a legacy global poolSize as the quiz pool", () => {
    // Every exercise with a global poolSize is quiz-only, so the two mean
    // the same thing and no migration is needed.
    const legacy = { ...makeExercise(), poolSize: 1 };
    const sanitized = sanitizeExerciseForClient(legacy, () => 0);
    expect(sanitized!.tasks).toHaveLength(1);
    expect(sanitized!.pools).toEqual([
      { type: ExerciseTaskType.QUIZ, served: 1, total: 2 },
    ]);
  });

  it("does not pool when the pool is not smaller than the task count", () => {
    const exercise = { ...makeExercise(), poolSizes: { quiz: 5 } };
    const sanitized = sanitizeExerciseForClient(exercise);
    expect(sanitized!.tasks).toHaveLength(2);
    expect(sanitized!.pools).toBeUndefined();
  });
});

/**
 * The reason pools are per type: one pool across a mixed exercise draws blind
 * to type, so some students would get no code task at all while others get
 * nothing but code.
 */
describe("pools across a mixed exercise", () => {
  const mixed = (poolSizes?: Record<string, number>): ServerExercise => ({
    passThreshold: 0.5,
    poolSizes,
    tasks: [
      { id: "q1", type: "quiz", prompt: "Q1", options: ["a", "b"], correctAnswers: [0], points: 1 },
      { id: "q2", type: "quiz", prompt: "Q2", options: ["a", "b"], correctAnswers: [0], points: 1 },
      { id: "q3", type: "quiz", prompt: "Q3", options: ["a", "b"], correctAnswers: [0], points: 1 },
      { id: "s1", type: "shortAnswer", prompt: "S1", acceptedAnswers: ["x"], points: 1 },
      { id: "s2", type: "shortAnswer", prompt: "S2", acceptedAnswers: ["y"], points: 1 },
      { id: "c1", type: "code", prompt: "C1", entryPoint: "f", tests: [], points: 1 },
      { id: "c2", type: "code", prompt: "C2", entryPoint: "f", tests: [], points: 1 },
    ] as never,
  });

  it("serves the configured number of EACH type, whatever the draw", () => {
    // Every rng, including degenerate ones, must produce the same shape.
    for (const rng of [() => 0, () => 0.5, () => 0.999, Math.random]) {
      const served = sanitizeExerciseForClient(
        mixed({ quiz: 2, code: 1 }),
        rng
      )!.tasks;
      const byType = (t: string) => served.filter((s) => s.type === t).length;
      expect(byType("quiz")).toBe(2);
      expect(byType("code")).toBe(1);
      // shortAnswer has no pool, so both are always served
      expect(byType("shortAnswer")).toBe(2);
    }
  });

  it("keeps the teacher's authored order — the draw picks which, not the order", () => {
    const served = sanitizeExerciseForClient(
      mixed({ quiz: 2, code: 1 }),
      () => 0.7
    )!.tasks;
    const authored = ["q1", "q2", "q3", "s1", "s2", "c1", "c2"];
    const positions = served.map((t) => authored.indexOf(t.id));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // and the code task is still last, not opening the exercise
    expect(served[served.length - 1].type).toBe(ExerciseTaskType.CODE);
  });

  /**
   * The draw must not change between renders. A server action refreshes the
   * page when it completes, and an unstable draw swapped the questions out
   * from under a half-answered exercise.
   */
  it("serves the identical set every time for the same seed", () => {
    const exercise = mixed({ quiz: 2, code: 1 });
    const draw = () =>
      sanitizeExerciseForClient(exercise, seededRng("student-1:guide-9"))!
        .tasks.map((t) => t.id)
        .join(",");
    const first = draw();
    for (let i = 0; i < 10; i++) expect(draw()).toBe(first);
  });

  it("gives different students different sets", () => {
    const exercise = mixed({ quiz: 2, code: 1 });
    const sets = new Set(
      ["a", "b", "c", "d", "e", "f"].map((s) =>
        sanitizeExerciseForClient(exercise, seededRng(`${s}:guide-9`))!
          .tasks.map((t) => t.id)
          .join(",")
      )
    );
    expect(sets.size).toBeGreaterThan(1);
  });

  it("reports each pooled type separately", () => {
    const sanitized = sanitizeExerciseForClient(mixed({ quiz: 2, code: 1 }));
    expect(sanitized!.pools).toEqual(
      expect.arrayContaining([
        { type: ExerciseTaskType.QUIZ, served: 2, total: 3 },
        { type: ExerciseTaskType.CODE, served: 1, total: 2 },
      ])
    );
    // shortAnswer is not pooled, so it is not listed
    expect(sanitized!.pools).toHaveLength(2);
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

  it("sends help links to the client — they are material, not answer key", () => {
    const exercise = shortAnswerExercise();
    (exercise.tasks[0] as never as { helpLinks: unknown }).helpLinks = [
      { label: "MDN — declarations", url: "https://example.test/declarations" },
    ];
    const served = sanitizeExerciseForClient(exercise)!.tasks[0];
    expect(served.helpLinks).toEqual([
      { label: "MDN — declarations", url: "https://example.test/declarations" },
    ]);
    // ...while the key still does not travel
    expect(JSON.stringify(served)).not.toContain("acceptedAnswers");
  });

  it("never leaks the accepted answers or the pattern to the client", () => {
    const exercise = shortAnswerExercise();
    (exercise.tasks[0] as never as { pattern: string }).pattern = "^const$";
    const serialized = JSON.stringify(sanitizeExerciseForClient(exercise));
    expect(serialized).not.toContain("acceptedAnswers");
    expect(serialized).not.toContain("const");
    expect(serialized).not.toContain("pattern");
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
    exercise.poolSizes = { quiz: 1 };
    const sanitized = sanitizeExerciseForClient(exercise, () => 0.99);
    expect(sanitized?.tasks).toHaveLength(1);
    expect(sanitized?.pools).toEqual([
      { type: ExerciseTaskType.QUIZ, served: 1, total: 2 }, // not three
    ]);
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
});
