import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ExerciseView } from "../../app/guides/components/exercise/ExerciseView";
import { ExerciseTaskType, type ExercisePublic } from "types/guideTypes";

// Mock the server action: first submission grades t1 wrong / t2 right.
jest.mock("serverActions/submitExercise", () => ({
  submitExercise: jest.fn().mockResolvedValue({
    success: true,
    message: "Exercise submitted",
    data: {
      score: 5,
      passed: false,
      earnedPoints: 1,
      totalPoints: 2,
      goalBreakdown: [
        { goal: "Understand letters", earnedPoints: 0, totalPoints: 1 },
        { goal: "Understand B", earnedPoints: 1, totalPoints: 1 },
      ],
      results: [
        {
          taskId: "t1",
          correct: false,
          pointsEarned: 0,
          pointsPossible: 1,
          hint: "Re-read the section on letters",
        },
        {
          taskId: "t2",
          correct: true,
          pointsEarned: 1,
          pointsPossible: 1,
          explanation: "B is correct",
        },
      ],
    },
  }),
}));

const exercise: ExercisePublic = {
  passThreshold: 0.7,
  tasks: [
    {
      type: ExerciseTaskType.QUIZ,
      id: "t1",
      prompt: "Pick A",
      options: ["A", "B"],
      allowMultiple: false,
      points: 1,
    },
    {
      type: ExerciseTaskType.QUIZ,
      id: "t2",
      prompt: "Pick B and C",
      options: ["A", "B", "C"],
      allowMultiple: true,
      points: 1,
    },
  ],
};

describe("ExerciseView", () => {
  it("shows expectations up front and the answered count", async () => {
    render(<ExerciseView guideId="g1" exercise={exercise} />);

    expect(
      screen.getByText(/2 questions · 70% to pass · unlimited attempts/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Choose one")).toBeInTheDocument();
    expect(
      screen.getByText("Select all that apply · partial credit")
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 2 answered")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("radio", { name: /^A$/ }));
    expect(screen.getByText("1 of 2 answered")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /^B$/ }));
    // all answered: count disappears, submit enables
    expect(screen.queryByText(/of 2 answered/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeEnabled();
  });

  it("shows the student's best previous attempt and pool size up front", () => {
    render(
      <ExerciseView
        guideId="g1"
        exercise={{ ...exercise, poolTotal: 10 }}
        bestAttempt={{
          score: 8,
          passed: true,
          attemptCount: 3,
          lastAttemptAt: "2026-06-01T10:00:00.000Z",
        }}
      />
    );

    expect(
      screen.getByText(/2 questions \(drawn from a pool of 10\)/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Your best so far:/)).toBeInTheDocument();
    expect(screen.getByText("8/10")).toBeInTheDocument();
    expect(screen.getByText(/3 attempts/)).toBeInTheDocument();
  });

  it("shows hint on wrong answers, explanation on correct ones, and clears stale feedback when an answer changes", async () => {
    render(<ExerciseView guideId="g1" exercise={exercise} />);

    fireEvent.click(screen.getByRole("radio", { name: /^A$/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /^B$/ }));
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    // graded: banner + per-task feedback (hint for wrong, explanation for right)
    await waitFor(() =>
      expect(screen.getByText(/Not passed yet/)).toBeInTheDocument()
    );
    expect(
      screen.getByText(/Not quite — Re-read the section on letters/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Correct — B is correct/)).toBeInTheDocument();

    // per-goal feedback renders with mastered/revisit states
    expect(
      screen.getByText(/Understand letters — 0\/1 points · worth revisiting/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Understand B — 1\/1 points$/)
    ).toBeInTheDocument();

    // changing t1's answer must clear ITS stale note, but keep t2's
    fireEvent.click(screen.getByRole("radio", { name: /^B$/ }));
    expect(
      screen.queryByText(/Not quite — Re-read the section on letters/)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Correct — B is correct/)).toBeInTheDocument();
  });
});
