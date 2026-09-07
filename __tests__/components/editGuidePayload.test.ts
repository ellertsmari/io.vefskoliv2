import {
  buildGuidePayload,
  exerciseFromGuide,
  formFromGuide,
  validateExercise,
  validateForm,
  type GuideForm,
} from "app/components/editGuides/editGuidePayload";
import type { GuideType } from "models/guide";

const guide = {
  title: "HTML & CSS - Layouting",
  description: "# Layout",
  topicsList: "flex, grid",
  order: 3,
  themeIdea: { title: "A landing page", description: "Build one" },
  module: { title: "3 - The fundamentals", number: 0 },
  knowledge: [{ knowledge: "Flexbox" }],
  skills: [{ skill: "Grid" }],
  resources: [{ link: "https://a", description: "A" }],
  classes: [],
  references: [],
  exercise: {
    passThreshold: 0.5,
    poolSize: 2,
    tasks: [
      { _id: "t1", type: "quiz", prompt: "Q?", options: ["a", "b"], correctAnswers: [0] },
      { _id: "t2", type: "code", prompt: "Write it", entryPoint: "add" },
      { _id: "t3", type: "quiz", prompt: "Q2?", options: ["c", "d"], correctAnswers: [1] },
    ],
  },
} as unknown as GuideType;

describe("formFromGuide", () => {
  it("flattens the guide into editable fields", () => {
    const form = formFromGuide(guide);
    expect(form.moduleTitle).toBe("3 - The fundamentals");
    expect(form.knowledge).toEqual(["Flexbox"]);
    expect(form.resources).toEqual([{ link: "https://a", description: "A" }]);
  });
});

describe("exerciseFromGuide", () => {
  it("carries hand-authored tasks through untouched and reads the legacy pool", () => {
    const exercise = exerciseFromGuide(guide);
    expect(exercise.poolSize).toBe(2);
    expect(exercise.tasks[1]).toEqual({
      kind: "opaque",
      raw: expect.objectContaining({ type: "code", entryPoint: "add" }),
    });
    expect(exercise.tasks[0]).toEqual(expect.objectContaining({ kind: "quiz", _id: "t1" }));
  });
});

describe("validateExercise", () => {
  it("wants a prompt, two options, an answer, and a pool smaller than the quiz", () => {
    const exercise = exerciseFromGuide(guide);
    // Two quiz questions: a pool of one is fine, a pool of two is the whole set.
    expect(validateExercise({ ...exercise, poolSize: 1 })).toBeNull();
    expect(validateExercise(exercise)).toMatch(/pool/);
    expect(validateExercise({ ...exercise, tasks: [] })).toMatch(/at least one/);
    const blank = { ...exercise.tasks[0], prompt: " " } as typeof exercise.tasks[0];
    expect(validateExercise({ ...exercise, tasks: [blank] })).toMatch(/Question 1/);
  });
});

describe("validateForm", () => {
  it("names the first thing missing", () => {
    const form = formFromGuide(guide);
    expect(validateForm(form)).toBeNull();
    expect(validateForm({ ...form, title: "" })).toMatch(/title/);
    expect(validateForm({ ...form, moduleTitle: "" })).toMatch(/module/);
    expect(validateForm({ ...form, knowledge: ["", "x"] })).toMatch(/goal/);
  });
});

describe("buildGuidePayload", () => {
  const form: GuideForm = formFromGuide(guide);

  it("derives module number and category, and drops empty list rows", () => {
    const payload = buildGuidePayload(
      { ...form, classes: [{ title: "", link: "" }, { title: "Slides", link: "https://s" }] },
      exerciseFromGuide(guide),
      "peerReview",
      "design",
      true
    );
    expect(payload.module).toEqual({ title: "3 - The fundamentals", number: 3 });
    expect(payload.category).toBe("designSpeciality");
    expect(payload.classes).toEqual([{ title: "Slides", link: "https://s" }]);
    expect(payload.exercise).toBeNull();
    expect(payload.gradingMode).toBe("peerReview");
  });

  it("writes an auto-graded exercise back with ids and opaque tasks intact", () => {
    const payload = buildGuidePayload(form, exerciseFromGuide(guide), "auto", "code", false);
    const exercise = payload.exercise as { tasks: Array<Record<string, unknown>>; poolSizes: unknown };
    expect(exercise.tasks.map((t) => t._id)).toEqual(["t1", "t2", "t3"]);
    expect(exercise.tasks[1].type).toBe("code");
    expect(exercise.poolSizes).toEqual({ quiz: 2 });
  });
});
