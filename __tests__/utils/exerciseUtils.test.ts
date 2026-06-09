import {
  gradeExercise,
  computeExerciseAnalytics,
  sanitizeExerciseForClient,
  sanitizeGuideForClient,
  ExerciseGradingError,
  type AttemptForAnalytics,
  type ServerExercise,
} from "utils/exerciseUtils";

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
    expect(sanitized!.tasks[0].options).toEqual(["A", "B", "C"]);
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
