import type { GuideType } from "../../models/guide";
import { extractModuleNumber } from "../../utils/moduleUtils";
import { axesToCategory, type Discipline } from "../../utils/guideTaxonomy";
import type { ExerciseForm } from "./ExerciseEditor";

/**
 * What the editor holds and what it sends. Kept apart from the component so
 * the rules — what counts as a valid exercise, how the form becomes a save —
 * can be tested without rendering a markdown editor.
 */

export type LinkItem = { link: string; description: string };
export type ClassItem = { title: string; link: string };
export type ReferenceItem = { type: string; name: string; link: string };

export type GuideForm = {
  title: string;
  description: string;
  topicsList: string;
  order: number;
  themeIdea: { title: string; description: string };
  moduleTitle: string;
  knowledge: string[];
  skills: string[];
  resources: LinkItem[];
  classes: ClassItem[];
  references: ReferenceItem[];
};

export type GradingMode = "peerReview" | "auto";

export const formFromGuide = (guide: GuideType): GuideForm => ({
  title: guide.title || "",
  description: guide.description || "",
  topicsList: guide.topicsList || "",
  order: guide.order || 0,
  themeIdea: {
    title: guide.themeIdea?.title || "",
    description: guide.themeIdea?.description || "",
  },
  moduleTitle: guide.module?.title || "",
  knowledge: guide.knowledge?.map((k) => k.knowledge) || [],
  skills: guide.skills?.map((s) => s.skill) || [],
  resources:
    guide.resources?.map((r) => ({
      link: r.link || "",
      description: r.description || "",
    })) || [],
  references:
    guide.references?.map((r) => ({
      type: r.type || "",
      name: r.name || "",
      link: r.link || "",
    })) || [],
  classes:
    guide.classes?.map((c) => ({ title: c.title || "", link: c.link || "" })) ||
    [],
});

/** The authoring copy of an exercise, including the answer key. */
export const exerciseFromGuide = (guide: GuideType): ExerciseForm => {
  const ex = guide.exercise;
  if (ex && Array.isArray(ex.tasks) && ex.tasks.length > 0) {
    return {
      passThreshold: ex.passThreshold ?? 0.7,
      tasks: ex.tasks.map((t: any) => {
        // Tasks this editor cannot author (short-answer, code — written by
        // hand in the database) are carried verbatim and written back
        // untouched. Reading them into the quiz shape below would replace
        // their fields with empty options and lose the task.
        if (t.type && t.type !== "quiz") {
          return { kind: "opaque", raw: t } as const;
        }
        return {
          kind: "quiz",
          // Preserved so the task keeps its identity across a save; stored
          // attempts key their answers by this id.
          _id: typeof t._id === "string" ? t._id : undefined,
          prompt: t.prompt || "",
          options: Array.isArray(t.options) ? t.options : ["", ""],
          correctAnswers: Array.isArray(t.correctAnswers) ? t.correctAnswers : [],
          allowMultiple: !!t.allowMultiple,
          points: t.points ?? 1,
          explanation: t.explanation || "",
          hint: t.hint || "",
          goal: t.goal || "",
        } as const;
      }),
      // The editor authors quiz questions only, so its pool field is the
      // quiz pool. A legacy global poolSize means exactly that.
      poolSize: ex.poolSizes?.quiz ?? ex.poolSize ?? 0,
    };
  }
  return {
    passThreshold: 0.7,
    poolSize: 0,
    tasks: [
      {
        kind: "quiz",
        prompt: "",
        options: ["", ""],
        correctAnswers: [],
        allowMultiple: false,
        points: 1,
        explanation: "",
        hint: "",
        goal: "",
      },
    ],
  };
};

/** An error message, or null when the exercise can be saved. */
export const validateExercise = (exercise: ExerciseForm): string | null => {
  if (exercise.tasks.length === 0) {
    return "Add at least one question to the exercise.";
  }
  for (let i = 0; i < exercise.tasks.length; i++) {
    const task = exercise.tasks[i];
    const n = i + 1;
    // Opaque tasks are authored in the database and validated there.
    if (task.kind !== "quiz") continue;
    if (!task.prompt.trim()) return `Question ${n}: add a prompt.`;
    const filledOptions = task.options.filter((o) => o.trim());
    if (filledOptions.length < 2) return `Question ${n}: add at least two options.`;
    if (task.correctAnswers.length === 0) {
      return `Question ${n}: mark at least one correct answer.`;
    }
  }
  const quizCount = exercise.tasks.filter((t) => t.kind === "quiz").length;
  if (exercise.poolSize >= quizCount && exercise.poolSize > 0) {
    return `The question pool must be smaller than the ${quizCount} quiz question(s) available (leave it empty to serve all).`;
  }
  return null;
};

/** What the guide must have before it can be saved, or null. */
export const validateForm = (form: GuideForm): string | null => {
  if (!form.title.trim()) return "Give the guide a title.";
  if (!form.moduleTitle) return "Pick a module.";
  if (!form.description.trim()) return "Add a description.";
  if (!form.themeIdea.title.trim() || !form.themeIdea.description.trim()) {
    return "Fill in the idea for return: a title and what to build.";
  }
  if (form.knowledge.some((k) => !k.trim()) || form.skills.some((s) => !s.trim())) {
    return "A goal is empty — fill it in or remove it.";
  }
  return null;
};

/** The body of the PUT that saves the guide. */
export const buildGuidePayload = (
  form: GuideForm,
  exercise: ExerciseForm,
  gradingMode: GradingMode,
  discipline: Discipline,
  isSpecialty: boolean
): Record<string, unknown> => {
  const grading =
    gradingMode === "auto"
      ? {
          gradingMode: "auto",
          exercise: {
            passThreshold: exercise.passThreshold,
            tasks: exercise.tasks.map((t) =>
              // Hand-authored task types go back exactly as they came.
              t.kind === "opaque"
                ? t.raw
                : {
                    type: "quiz",
                    // Keeps the task's identity across the save, so stored
                    // attempts stay attached to their question.
                    ...(t._id ? { _id: t._id } : {}),
                    prompt: t.prompt.trim(),
                    options: t.options.map((o) => o.trim()),
                    allowMultiple: t.allowMultiple,
                    points: t.points,
                    correctAnswers: t.correctAnswers,
                    ...(t.explanation.trim() ? { explanation: t.explanation.trim() } : {}),
                    ...(t.hint.trim() ? { hint: t.hint.trim() } : {}),
                    ...(t.goal.trim() ? { goal: t.goal.trim() } : {}),
                  }
            ),
            ...(exercise.poolSize > 0 ? { poolSizes: { quiz: exercise.poolSize } } : {}),
          },
        }
      : // Peer-reviewed guide: clear any previously authored exercise.
        { gradingMode: "peerReview", exercise: null };

  // Empty list rows are dropped rather than saved as blanks.
  const kept = <T extends Record<string, string>>(rows: T[]) =>
    rows.filter((row) => Object.values(row).some((value) => value.trim()));

  return {
    title: form.title.trim(),
    description: form.description,
    topicsList: form.topicsList,
    order: form.order,
    themeIdea: {
      title: form.themeIdea.title.trim(),
      description: form.themeIdea.description,
    },
    // The number is derived from the title; the stored one was unreliable.
    module: {
      title: form.moduleTitle,
      number: extractModuleNumber(form.moduleTitle),
    },
    knowledge: form.knowledge.map((k) => ({ knowledge: k.trim() })),
    skills: form.skills.map((s) => ({ skill: s.trim() })),
    resources: kept(form.resources),
    classes: kept(form.classes),
    references: kept(form.references),
    ...grading,
    // Canonical taxonomy axes + derived legacy `category` mirror.
    discipline,
    isSpecialty,
    category: axesToCategory(discipline, isSpecialty),
  };
};
