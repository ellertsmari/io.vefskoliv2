"use client";

import {
  Section,
  SectionTitle,
  InputGroup,
  Label,
  Input,
  TextArea,
  ArraySection,
  MultiFieldItem,
  MultiFieldRow,
  MultiFieldGroup,
  SmallLabel,
  RemoveButton,
  RemoveButtonSmall,
  AddButton,
} from "./styles.EditGuideForm";

/**
 * Authoring shape of a quiz task. `correctAnswers` holds the indices into
 * `options` that are correct. This mirrors the server-side exercise schema in
 * app/models/guide.ts; it is teacher-only and includes the answer key.
 */
export type QuizTaskForm = {
  kind: "quiz";
  /** Preserved across a save so the task keeps its identity; stored attempts
   *  key their answers by this id. Absent on a newly added question. */
  _id?: string;
  prompt: string;
  options: string[];
  correctAnswers: number[];
  allowMultiple: boolean;
  points: number;
  explanation: string;
  hint: string;
  /** knowledge goal this question assesses; "" = untagged */
  goal: string;
};

/**
 * A task this editor cannot author — short-answer and code tasks are written by
 * hand in the database (see docs/exercise-engine-tasks.md). Held verbatim and
 * written back untouched so an unrelated edit here cannot destroy them.
 */
export type OpaqueTaskForm = {
  kind: "opaque";
  raw: Record<string, unknown>;
};

export type TaskForm = QuizTaskForm | OpaqueTaskForm;

export type ExerciseForm = {
  passThreshold: number; // 0..1
  /** 0 = serve every question; N = serve N random questions per visit */
  poolSize: number;
  tasks: TaskForm[];
};

export const emptyTask = (): QuizTaskForm => ({
  kind: "quiz",
  prompt: "",
  options: ["", ""],
  correctAnswers: [],
  allowMultiple: false,
  points: 1,
  explanation: "",
  hint: "",
  goal: "",
});

export const ExerciseEditor = ({
  value,
  onChange,
  knowledgeGoals = [],
}: {
  value: ExerciseForm;
  onChange: (next: ExerciseForm) => void;
  /** the guide's knowledge items, offered as goal tags for each question */
  knowledgeGoals?: string[];
}) => {
  /** Editing only ever applies to quiz tasks; opaque ones pass through. */
  const updateTask = (index: number, patch: Partial<QuizTaskForm>) => {
    onChange({
      ...value,
      tasks: value.tasks.map((t, i) =>
        i === index && t.kind === "quiz" ? { ...t, ...patch } : t
      ),
    });
  };

  /** The quiz task at this index, or null when it is an opaque one. */
  const quizAt = (index: number): QuizTaskForm | null => {
    const task = value.tasks[index];
    return task && task.kind === "quiz" ? task : null;
  };

  const addTask = () =>
    onChange({ ...value, tasks: [...value.tasks, emptyTask()] });

  const removeTask = (index: number) =>
    onChange({ ...value, tasks: value.tasks.filter((_, i) => i !== index) });

  const addOption = (taskIndex: number) => {
    const task = quizAt(taskIndex);
    if (!task) return;
    updateTask(taskIndex, { options: [...task.options, ""] });
  };

  const updateOption = (taskIndex: number, optionIndex: number, text: string) => {
    const task = quizAt(taskIndex);
    if (!task) return;
    updateTask(taskIndex, {
      options: task.options.map((o, i) => (i === optionIndex ? text : o)),
    });
  };

  const removeOption = (taskIndex: number, optionIndex: number) => {
    const task = quizAt(taskIndex);
    if (!task) return;
    // Drop the option and keep `correctAnswers` pointing at the right options:
    // remove this index and shift any higher indices down by one.
    const correctAnswers = task.correctAnswers
      .filter((i) => i !== optionIndex)
      .map((i) => (i > optionIndex ? i - 1 : i));
    updateTask(taskIndex, {
      options: task.options.filter((_, i) => i !== optionIndex),
      correctAnswers,
    });
  };

  const toggleCorrect = (taskIndex: number, optionIndex: number) => {
    const task = quizAt(taskIndex);
    if (!task) return;
    if (!task.allowMultiple) {
      // single-choice: exactly one correct option
      updateTask(taskIndex, { correctAnswers: [optionIndex] });
      return;
    }
    const correctAnswers = task.correctAnswers.includes(optionIndex)
      ? task.correctAnswers.filter((i) => i !== optionIndex)
      : [...task.correctAnswers, optionIndex];
    updateTask(taskIndex, { correctAnswers });
  };

  const setAllowMultiple = (taskIndex: number, allowMultiple: boolean) => {
    const task = quizAt(taskIndex);
    if (!task) return;
    // When switching to single-choice, keep at most one correct answer.
    const correctAnswers =
      !allowMultiple && task.correctAnswers.length > 1
        ? [task.correctAnswers[0]]
        : task.correctAnswers;
    updateTask(taskIndex, { allowMultiple, correctAnswers });
  };

  return (
    <Section>
      <SectionTitle>Exercise (auto-graded)</SectionTitle>

      <InputGroup>
        <Label htmlFor="passThreshold">Pass threshold (%)</Label>
        <Input
          id="passThreshold"
          type="number"
          min={0}
          max={100}
          value={Math.round(value.passThreshold * 100)}
          onChange={(e) =>
            onChange({
              ...value,
              passThreshold: Math.min(
                100,
                Math.max(0, parseInt(e.target.value) || 0)
              ) / 100,
            })
          }
        />
        <SmallLabel>
          Percentage of points a student needs to pass the exercise.
        </SmallLabel>
      </InputGroup>

      <InputGroup>
        <Label htmlFor="poolSize">Question pool (optional)</Label>
        <Input
          id="poolSize"
          type="number"
          min={0}
          max={Math.max(0, value.tasks.length - 1)}
          value={value.poolSize || ""}
          placeholder="Serve all questions"
          onChange={(e) =>
            onChange({
              ...value,
              poolSize: Math.max(0, parseInt(e.target.value) || 0),
            })
          }
        />
        <SmallLabel>
          Serve this many randomly chosen questions per visit instead of all{" "}
          {value.tasks.length}. Leave empty to serve every question. Larger
          pools make retries more meaningful — students can&apos;t memorize a
          fixed set.
        </SmallLabel>
      </InputGroup>

      <ArraySection>
        {value.tasks.map((task, taskIndex) =>
          task.kind === "opaque" ? (
            <MultiFieldItem key={taskIndex}>
              <SmallLabel>
                Question {taskIndex + 1} — {String(task.raw.type)} task
              </SmallLabel>
              <p>
                {typeof task.raw.prompt === "string"
                  ? task.raw.prompt
                  : "(no prompt)"}
              </p>
              <SmallLabel>
                This question type is authored directly in the database and
                cannot be edited here. It is kept exactly as it is when you
                save.
              </SmallLabel>
            </MultiFieldItem>
          ) : (
          <MultiFieldItem key={taskIndex}>
            <MultiFieldRow>
              <MultiFieldGroup>
                <SmallLabel>Question {taskIndex + 1}</SmallLabel>
                <TextArea
                  value={task.prompt}
                  onChange={(e) =>
                    updateTask(taskIndex, { prompt: e.target.value })
                  }
                  placeholder="Question prompt"
                  rows={2}
                  required
                />
              </MultiFieldGroup>
              <RemoveButton type="button" onClick={() => removeTask(taskIndex)}>
                Remove question
              </RemoveButton>
            </MultiFieldRow>

            <MultiFieldRow>
              <MultiFieldGroup style={{ flex: "0 0 220px" }}>
                <SmallLabel>
                  <input
                    type="checkbox"
                    checked={task.allowMultiple}
                    onChange={(e) =>
                      setAllowMultiple(taskIndex, e.target.checked)
                    }
                    style={{ marginRight: "0.4rem" }}
                  />
                  Allow multiple correct answers
                </SmallLabel>
              </MultiFieldGroup>
              <MultiFieldGroup style={{ flex: "0 0 120px" }}>
                <SmallLabel>Points</SmallLabel>
                <Input
                  type="number"
                  min={1}
                  value={task.points}
                  onChange={(e) =>
                    updateTask(taskIndex, {
                      points: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                />
              </MultiFieldGroup>
            </MultiFieldRow>

            <SmallLabel>
              Options (check the {task.allowMultiple ? "correct answers" : "correct answer"})
            </SmallLabel>
            {task.options.map((option, optionIndex) => (
              <MultiFieldRow key={optionIndex}>
                <MultiFieldGroup style={{ flex: "0 0 40px" }}>
                  <input
                    type={task.allowMultiple ? "checkbox" : "radio"}
                    name={`correct-${taskIndex}`}
                    checked={task.correctAnswers.includes(optionIndex)}
                    onChange={() => toggleCorrect(taskIndex, optionIndex)}
                    aria-label={`Mark option ${optionIndex + 1} correct`}
                  />
                </MultiFieldGroup>
                <MultiFieldGroup>
                  <Input
                    value={option}
                    onChange={(e) =>
                      updateOption(taskIndex, optionIndex, e.target.value)
                    }
                    placeholder={`Option ${optionIndex + 1}`}
                    required
                  />
                </MultiFieldGroup>
                <RemoveButtonSmall
                  type="button"
                  onClick={() => removeOption(taskIndex, optionIndex)}
                  disabled={task.options.length <= 2}
                >
                  Remove
                </RemoveButtonSmall>
              </MultiFieldRow>
            ))}
            <AddButton type="button" onClick={() => addOption(taskIndex)}>
              Add Option
            </AddButton>

            <MultiFieldRow>
              <MultiFieldGroup>
                <SmallLabel>
                  Explanation (shown when answered correctly, optional)
                </SmallLabel>
                <TextArea
                  value={task.explanation}
                  onChange={(e) =>
                    updateTask(taskIndex, { explanation: e.target.value })
                  }
                  placeholder="Why this answer is correct"
                  rows={2}
                />
              </MultiFieldGroup>
            </MultiFieldRow>

            {knowledgeGoals.length > 0 && (
              <MultiFieldRow>
                <MultiFieldGroup>
                  <SmallLabel>
                    Knowledge goal this question assesses (optional)
                  </SmallLabel>
                  <select
                    value={task.goal}
                    onChange={(e) =>
                      updateTask(taskIndex, { goal: e.target.value })
                    }
                    style={{ padding: "0.4rem", maxWidth: "100%" }}
                  >
                    <option value="">— not tagged —</option>
                    {knowledgeGoals.map((goal) => (
                      <option key={goal} value={goal}>
                        {goal}
                      </option>
                    ))}
                  </select>
                  <SmallLabel>
                    Tagged questions give students per-goal feedback
                    (&quot;you&apos;ve got X down, review Y&quot;).
                  </SmallLabel>
                </MultiFieldGroup>
              </MultiFieldRow>
            )}

            <MultiFieldRow>
              <MultiFieldGroup>
                <SmallLabel>
                  Hint (shown when answered incorrectly, optional)
                </SmallLabel>
                <TextArea
                  value={task.hint}
                  onChange={(e) =>
                    updateTask(taskIndex, { hint: e.target.value })
                  }
                  placeholder='Point back at the material without revealing the answer, e.g. "Revisit the section on selectors"'
                  rows={2}
                />
              </MultiFieldGroup>
            </MultiFieldRow>
          </MultiFieldItem>
          )
        )}
        <AddButton type="button" onClick={addTask}>
          Add Question
        </AddButton>
      </ArraySection>
    </Section>
  );
};
