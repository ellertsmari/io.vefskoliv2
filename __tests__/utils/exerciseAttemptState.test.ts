import {
  deriveAttempt,
  freshAttemptState,
  mergeLegacyAttempts,
  pickReplacement,
  type AttemptState,
  type LegacyAttempt,
} from "utils/exerciseAttemptState";
import type { ServerExercise } from "utils/exerciseUtils";
import type { CodeFeedback } from "types/guideTypes";

const quiz = (id: string, goal?: string, points = 1) => ({
  id,
  type: "quiz" as const,
  prompt: `Q ${id}`,
  options: ["right", "wrong"],
  correctAnswers: [0],
  points,
  ...(goal ? { goal } : {}),
});

const short = (id: string) => ({
  id,
  type: "shortAnswer" as const,
  prompt: `S ${id}`,
  acceptedAnswers: ["const"],
  points: 1,
});

const code = (id: string, points = 4) => ({
  id,
  type: "code" as const,
  prompt: `C ${id}`,
  entryPoint: "solve",
  tests: [],
  points,
});

const feedback = (passed: number, total = 2): CodeFeedback => ({
  compiled: true,
  typeErrors: [],
  tests: [],
  testsPassed: passed,
  testsTotal: total,
  constructsMet: true,
  missingConstructs: [],
});

const state = (over: Partial<AttemptState> = {}): AttemptState => ({
  slots: [],
  served: [],
  tries: {},
  answers: {},
  codeResults: {},
  ...over,
});

const RIGHT = [0];
const WRONG = [1];

describe("multiple choice: one guess, then half for a new question", () => {
  const exercise: ServerExercise = {
    passThreshold: 0.7,
    tasks: [quiz("a"), quiz("b"), quiz("c")],
  };

  it("earns full points for a right first guess", () => {
    const { items } = deriveAttempt(
      exercise,
      state({ slots: [{ entries: [{ taskId: "a", answer: RIGHT }] }] })
    );
    expect(items[0]).toMatchObject({ status: "correct", earned: 1 });
  });

  it("locks the question on a wrong guess, and says the next is worth half", () => {
    const { items } = deriveAttempt(
      exercise,
      state({ slots: [{ entries: [{ taskId: "a", answer: WRONG }] }] })
    );
    expect(items[0]).toMatchObject({
      taskId: "a",
      status: "locked",
      earned: 0,
      worth: 0.5,
    });
  });

  it("halves again for each wrong guess before the right one", () => {
    const slots = [
      {
        entries: [
          { taskId: "a", answer: WRONG },
          { taskId: "b", answer: WRONG },
          { taskId: "c", answer: RIGHT },
        ],
      },
    ];
    const { items, summary } = deriveAttempt(exercise, state({ slots }));
    expect(items[0]).toMatchObject({ taskId: "c", status: "correct", earned: 0.25 });
    // The slot is still worth one point of the total, whatever it earned.
    expect(summary.totalPoints).toBe(1);
  });

  it("shows a replacement where the locked question was", () => {
    const slots = [
      { entries: [{ taskId: "a", answer: WRONG }, { taskId: "c" }] },
      { entries: [{ taskId: "b" }] },
    ];
    const { items } = deriveAttempt(exercise, state({ slots }));
    expect(items.map((i) => i.taskId)).toEqual(["c", "b"]);
    expect(items[0]).toMatchObject({ status: "open", worth: 0.5 });
  });
});

describe("short answers: each wrong try halves the next", () => {
  const exercise: ServerExercise = { tasks: [short("s")] };

  it("earns full points first time, half after one wrong try", () => {
    const first = deriveAttempt(
      exercise,
      state({ served: ["s"], tries: { s: ["const"] } })
    );
    expect(first.items[0]).toMatchObject({ status: "correct", earned: 1 });

    const second = deriveAttempt(
      exercise,
      state({ served: ["s"], tries: { s: ["var", "const"] } })
    );
    expect(second.items[0]).toMatchObject({ status: "correct", earned: 0.5 });
  });

  it("says what the next try is worth while still wrong", () => {
    const { items } = deriveAttempt(
      exercise,
      state({ served: ["s"], tries: { s: ["var", "let"] } })
    );
    expect(items[0]).toMatchObject({ status: "tried", worth: 0.25 });
  });

  it("does not count an answer held for the teacher as wrong", () => {
    // "cnst" is one edit from "const": held, not marked wrong.
    const { items } = deriveAttempt(
      exercise,
      state({ served: ["s"], tries: { s: ["cnst"] } })
    );
    expect(items[0]).toMatchObject({ status: "pending", worth: 1 });
  });

  it("credits a held answer at its own try once the teacher accepts it", () => {
    const accepted: ServerExercise = {
      tasks: [{ ...short("s"), acceptedAnswers: ["const", "cnst"] }],
    };
    const { items } = deriveAttempt(
      accepted,
      state({ served: ["s"], tries: { s: ["var", "cnst"] } })
    );
    expect(items[0]).toMatchObject({ status: "correct", earned: 0.5 });
  });
});

describe("code: scored on the final code", () => {
  const exercise: ServerExercise = { tasks: [code("k")] };

  it("gives partial credit, and full marks however many runs it took", () => {
    const partial = deriveAttempt(
      exercise,
      state({ served: ["k"], codeResults: { k: feedback(1) } })
    );
    expect(partial.items[0]).toMatchObject({ status: "tried", earned: 2, worth: 4 });

    const done = deriveAttempt(
      exercise,
      state({ served: ["k"], codeResults: { k: feedback(2) } })
    );
    expect(done.items[0]).toMatchObject({ status: "correct", earned: 4 });
  });
});

describe("the score", () => {
  const exercise: ServerExercise = {
    passThreshold: 0.7,
    tasks: [quiz("a"), quiz("b"), quiz("c"), short("s")],
  };

  it("passes the moment it reaches the pass mark", () => {
    const three = deriveAttempt(
      exercise,
      state({
        slots: [
          { entries: [{ taskId: "a", answer: RIGHT }] },
          { entries: [{ taskId: "b", answer: RIGHT }] },
          { entries: [{ taskId: "c", answer: RIGHT }] },
        ],
        served: ["s"],
      })
    );
    expect(three.summary).toMatchObject({
      score: 7.5,
      passed: true,
      answered: 3,
      total: 4,
      perfect: false,
    });

    const two = deriveAttempt(
      exercise,
      state({
        slots: [
          { entries: [{ taskId: "a", answer: RIGHT }] },
          { entries: [{ taskId: "b", answer: RIGHT }] },
          { entries: [{ taskId: "c" }] },
        ],
        served: ["s"],
      })
    );
    expect(two.summary).toMatchObject({ score: 5, passed: false });
  });

  it("drops a question deleted from the guide instead of scoring it", () => {
    const { summary } = deriveAttempt(
      exercise,
      state({ served: ["s", "gone"], tries: { s: ["const"] } })
    );
    expect(summary).toMatchObject({ totalPoints: 1, earnedPoints: 1 });
  });
});

describe("pickReplacement", () => {
  const exercise: ServerExercise = {
    tasks: [
      quiz("loops1", "loops"),
      quiz("loops2", "loops"),
      quiz("types1", "types"),
      quiz("types2", "types"),
    ],
  };

  it("prefers a question on the same goal", () => {
    const s = state({ slots: [{ entries: [{ taskId: "loops1", answer: WRONG }] }] });
    for (const r of [0, 0.5, 0.99]) {
      expect(pickReplacement(exercise, s, "loops1", () => r)?.id).toBe("loops2");
    }
  });

  it("falls back to any unseen question when the goal is used up", () => {
    const s = state({
      slots: [
        { entries: [{ taskId: "loops1", answer: WRONG }, { taskId: "loops2", answer: WRONG }] },
      ],
    });
    expect(
      ["types1", "types2"].includes(
        pickReplacement(exercise, s, "loops2", () => 0)?.id ?? ""
      )
    ).toBe(true);
  });

  it("never serves a question the student has held, and gives up when none are left", () => {
    const s = state({
      slots: [
        { entries: [{ taskId: "loops1", answer: WRONG }, { taskId: "loops2", answer: WRONG }] },
        { entries: [{ taskId: "types1", answer: RIGHT }] },
        { entries: [{ taskId: "types2", answer: WRONG }] },
      ],
    });
    expect(pickReplacement(exercise, s, "types2", () => 0)).toBeNull();
  });
});

describe("freshAttemptState", () => {
  it("serves the pool size as quiz slots and the rest as tasks", () => {
    const exercise: ServerExercise = {
      poolSizes: { quiz: 2 } as ServerExercise["poolSizes"],
      tasks: [quiz("a"), quiz("b"), quiz("c"), short("s"), code("k")],
    };
    const s = freshAttemptState(exercise, () => 0.3);
    expect(s.slots).toHaveLength(2);
    expect(s.served).toEqual(["s", "k"]);
  });
});

/**
 * Old numbered attempts are folded into one with a one-time amnesty: anything
 * right in ANY attempt counts in full, the rest is open to do again, and
 * nobody's grade goes down.
 */
describe("mergeLegacyAttempts", () => {
  const exercise: ServerExercise = {
    passThreshold: 0.7,
    poolSizes: { quiz: 2 } as ServerExercise["poolSizes"],
    tasks: [quiz("a"), quiz("b"), quiz("c"), quiz("d"), short("s"), code("k")],
  };

  const progress = (tries: number, correct: boolean) => ({
    tries,
    correct,
    firstTryCorrect: correct && tries === 1,
    skipped: false,
  });

  it("counts an answer right only on a later try at full points", () => {
    const merged = mergeLegacyAttempts(
      exercise,
      [
        {
          attemptNumber: 1,
          answers: { a: RIGHT, s: "const" },
          taskProgress: { a: progress(3, true), s: progress(2, true) },
        },
      ],
      () => 0
    );
    const { items } = deriveAttempt(exercise, merged);
    expect(items.find((i) => i.taskId === "a")).toMatchObject({ status: "correct", earned: 1 });
    expect(items.find((i) => i.taskId === "s")).toMatchObject({ status: "correct", earned: 1 });
  });

  it("keeps what was right in ANY attempt and reopens what never was", () => {
    const merged = mergeLegacyAttempts(
      exercise,
      [
        { attemptNumber: 1, answers: { a: RIGHT }, taskProgress: { a: progress(1, true) } },
        { attemptNumber: 2, answers: { c: WRONG }, taskProgress: { c: progress(4, false) } },
      ],
      () => 0
    );
    const { items } = deriveAttempt(exercise, merged);
    const quizItems = items.filter((i) => i.type === "quiz");
    // Still the pool size — one right answer and one to do again.
    expect(quizItems).toHaveLength(2);
    expect(quizItems.find((i) => i.taskId === "a")?.status).toBe("correct");
    expect(quizItems.find((i) => i.taskId === "c")).toMatchObject({
      status: "open",
      worth: 1,
    });
  });

  it("keeps the best code result across attempts, with its code", () => {
    const merged = mergeLegacyAttempts(
      exercise,
      [
        { attemptNumber: 1, answers: { k: "good" }, codeResults: { k: feedback(2) }, taskProgress: { k: progress(1, true) } },
        { attemptNumber: 2, answers: { k: "worse" }, codeResults: { k: feedback(1) }, taskProgress: { k: progress(1, false) } },
      ],
      () => 0
    );
    expect(merged.answers.k).toBe("good");
    expect(deriveAttempt(exercise, merged).items.find((i) => i.taskId === "k")).toMatchObject({
      status: "correct",
      earned: 4,
    });
  });

  it("never scores below the best old attempt", () => {
    // Old best: attempt 2 had a and b right first time, and the code done.
    const legacy: LegacyAttempt[] = [
      {
        attemptNumber: 1,
        answers: { c: RIGHT, s: "var" },
        taskProgress: { c: progress(2, true), s: progress(1, false) },
      },
      {
        attemptNumber: 2,
        answers: { a: RIGHT, b: RIGHT, k: "x" },
        codeResults: { k: feedback(2) },
        taskProgress: { a: progress(1, true), b: progress(1, true), k: progress(1, true) },
      },
    ];
    const { summary } = deriveAttempt(
      exercise,
      mergeLegacyAttempts(exercise, legacy, () => 0)
    );
    // a, b and the code: 1 + 1 + 4 of 2 + 1 + 4.
    expect(summary.earnedPoints).toBe(6);
    expect(summary.totalPoints).toBe(7);
  });

  it("carries a short answer still waiting on the teacher", () => {
    const merged = mergeLegacyAttempts(
      exercise,
      [{ attemptNumber: 1, answers: { s: "cnst" }, taskProgress: { s: progress(1, false) } }],
      () => 0
    );
    expect(merged.tries.s).toEqual(["cnst"]);
  });

  it("does not carry an answer the current key no longer accepts", () => {
    const merged = mergeLegacyAttempts(
      exercise,
      [{ attemptNumber: 1, answers: { a: WRONG }, taskProgress: { a: progress(1, true) } }],
      () => 0
    );
    expect(deriveAttempt(exercise, merged).items.find((i) => i.taskId === "a")?.status).toBe("open");
  });
});
