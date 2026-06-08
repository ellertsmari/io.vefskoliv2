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
  prompt: string;
  options: string[];
  correctAnswers: number[];
  allowMultiple: boolean;
  points: number;
  explanation: string;
};

export type ExerciseForm = {
  passThreshold: number; // 0..1
  tasks: QuizTaskForm[];
};

export const emptyTask = (): QuizTaskForm => ({
  prompt: "",
  options: ["", ""],
  correctAnswers: [],
  allowMultiple: false,
  points: 1,
  explanation: "",
});

export const ExerciseEditor = ({
  value,
  onChange,
}: {
  value: ExerciseForm;
  onChange: (next: ExerciseForm) => void;
}) => {
  const updateTask = (index: number, patch: Partial<QuizTaskForm>) => {
    onChange({
      ...value,
      tasks: value.tasks.map((t, i) => (i === index ? { ...t, ...patch } : t)),
    });
  };

  const addTask = () =>
    onChange({ ...value, tasks: [...value.tasks, emptyTask()] });

  const removeTask = (index: number) =>
    onChange({ ...value, tasks: value.tasks.filter((_, i) => i !== index) });

  const addOption = (taskIndex: number) => {
    const task = value.tasks[taskIndex];
    updateTask(taskIndex, { options: [...task.options, ""] });
  };

  const updateOption = (taskIndex: number, optionIndex: number, text: string) => {
    const task = value.tasks[taskIndex];
    updateTask(taskIndex, {
      options: task.options.map((o, i) => (i === optionIndex ? text : o)),
    });
  };

  const removeOption = (taskIndex: number, optionIndex: number) => {
    const task = value.tasks[taskIndex];
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
    const task = value.tasks[taskIndex];
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
    const task = value.tasks[taskIndex];
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

      <ArraySection>
        {value.tasks.map((task, taskIndex) => (
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
                <SmallLabel>Explanation (shown after submitting, optional)</SmallLabel>
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
          </MultiFieldItem>
        ))}
        <AddButton type="button" onClick={addTask}>
          Add Question
        </AddButton>
      </ArraySection>
    </Section>
  );
};
