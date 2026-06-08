import {
  gradeExercise,
  sanitizeExerciseForClient,
  sanitizeGuideForClient,
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
    },
    {
      id: "t2",
      type: "quiz",
      prompt: "Pick A and C",
      options: ["A", "B", "C"],
      allowMultiple: true,
      points: 1,
      correctAnswers: [0, 2],
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

  it("requires an exact set match for multi-select (no partial credit)", () => {
    const result = gradeExercise(makeExercise(), { t1: [0], t2: [0] });
    expect(result.results.find((r) => r.taskId === "t2")?.correct).toBe(false);
    expect(result.score).toBe(5);
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

  it("weights tasks by their points", () => {
    const exercise = makeExercise();
    exercise.tasks[0].points = 3; // t1 worth 3, t2 worth 1 => total 4
    const result = gradeExercise(exercise, { t1: [0] });
    expect(result.earnedPoints).toBe(3);
    expect(result.totalPoints).toBe(4);
    expect(result.score).toBe(7.5);
  });
});

describe("sanitizeExerciseForClient", () => {
  it("strips the answer key and explanations", () => {
    const sanitized = sanitizeExerciseForClient(makeExercise());
    expect(sanitized).toBeDefined();
    const serialized = JSON.stringify(sanitized);
    expect(serialized).not.toContain("correctAnswers");
    expect(serialized).not.toContain("A is correct");
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
