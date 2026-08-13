import { knownTasks, taskId } from "./exerciseUtils";
import type { CodeResults, ServerCodeTask, ServerExercise } from "./exerciseUtils";
import type { ExerciseAnswers } from "./exerciseUtils";
import { runCodeSubmission } from "./codeRunner";

/**
 * Run every code task in an exercise against the student's submission.
 *
 * SERVER ONLY — reaches the sandbox. Sits apart from exerciseUtils so that
 * module stays synchronous and importable from anywhere: the TypeScript
 * compiler and the WebAssembly interpreter must never end up in a client
 * bundle or in the synchronous grading path.
 *
 * Tasks run one after another rather than in parallel: each gets its own time
 * and memory budget, and a runaway submission should not be able to start
 * several interpreters at once.
 */
export const runCodeTasks = async (
  exercise: ServerExercise,
  answers: ExerciseAnswers
): Promise<CodeResults> => {
  const codeTasks = knownTasks(exercise).filter(
    (t): t is ServerCodeTask => t.type === "code"
  );
  if (codeTasks.length === 0) return {};

  const results: CodeResults = {};
  for (const task of codeTasks) {
    const id = taskId(task);
    const submission = answers[id];
    if (typeof submission !== "string") continue;

    try {
      results[id] = await runCodeSubmission(
        {
          entryPoint: task.entryPoint,
          tests: task.tests ?? [],
          requires: task.requires,
        },
        submission
      );
    } catch (error) {
      // The sandbox itself failed — a module that would not load, a budget
      // that ran out, something environmental. That must not cost the student
      // the rest of their submission: without this, one broken code task
      // throws away ten correct quiz answers and they see only "Failed to
      // submit exercise". Attempts are unlimited and the best one counts, so a
      // zero here costs nothing once the grader is working again.
      console.error(`[runCodeTasks] grader failed for task ${id}`, error);
      results[id] = {
        compiled: false,
        typeErrors: [],
        tests: [],
        testsPassed: 0,
        testsTotal: (task.tests ?? []).length,
        constructsMet: false,
        missingConstructs: task.requires ?? [],
        runtimeError: {
          summary:
            "The code grader could not run. This is a problem on our side, not with your code.",
          detail:
            "Your other answers were still graded. Please try submitting again — your best attempt is the one that counts.",
        },
      };
    }
  }
  return results;
};
