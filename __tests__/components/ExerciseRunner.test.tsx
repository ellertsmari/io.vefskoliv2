import { fireEvent, render, screen } from "@testing-library/react";
import { ExerciseRunner } from "../../app/guides/components/exercise/ExerciseRunner";
import {
  checkAnswer,
  newQuestion,
  openExercise,
  type ExerciseItem,
} from "serverActions/exerciseSession";
import { ExerciseTaskType } from "types/guideTypes";

jest.mock("serverActions/exerciseSession", () => ({
  openExercise: jest.fn(),
  checkAnswer: jest.fn(),
  newQuestion: jest.fn(),
  getExerciseSummary: jest.fn(),
}));

const quiz = (id: string) => ({
  id,
  type: ExerciseTaskType.QUIZ,
  prompt: `Question ${id}`,
  points: 1,
  options: ["Right option", "Wrong option"],
  allowMultiple: false,
});

const item = (taskId: string, over: Partial<ExerciseItem> = {}): ExerciseItem => ({
  taskId,
  type: ExerciseTaskType.QUIZ,
  status: "open",
  worth: 1,
  earned: 0,
  base: 1,
  tries: 0,
  ...over,
});

const score = {
  score: 0,
  passed: false,
  earnedPoints: 0,
  totalPoints: 2,
  perfect: false,
  answered: 0,
  total: 2,
};

const open = (items: Record<string, ExerciseItem>, onClose = jest.fn()) => {
  (openExercise as jest.Mock).mockResolvedValue({
    success: true,
    message: "",
    data: {
      exercise: { tasks: [quiz("a"), quiz("b")], passThreshold: 0.7 },
      items,
      score,
    },
  });
  render(<ExerciseRunner guideId="g1" onClose={onClose} />);
  return onClose;
};

describe("ExerciseRunner", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the pass mark and what the question is worth", async () => {
    open({ a: item("a"), b: item("b") });
    expect(await screen.findByText(/pass mark 7\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/one guess · worth 1 point/i)).toBeInTheDocument();
  });

  /**
   * Students pressed Finish to "save" before going home. There is no Finish:
   * every answer is saved when checked, and closing is just closing.
   */
  it("has no Finish, and says the work is saved", async () => {
    const onClose = open({ a: item("a"), b: item("b") });
    await screen.findByText(/every answer is saved as you check it/i);
    expect(screen.queryByRole("button", { name: /finish/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("reveals the answer on a locked question and offers a new one at half", async () => {
    open({
      a: item("a", {
        status: "locked",
        worth: 0.5,
        tries: 1,
        lastAnswer: [1],
        canReplace: true,
        reveal: { correctAnswers: [0], explanation: "It is the right one" },
      }),
      b: item("b"),
    });

    expect(await screen.findByText("Right option", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/this question is now locked/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^locked$/i })).toBeDisabled();

    (newQuestion as jest.Mock).mockResolvedValue({
      success: true,
      message: "",
      data: {
        replaced: "a",
        task: quiz("c"),
        item: item("c", { worth: 0.5 }),
        score,
      },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /new question — worth ½ point/i })
    );

    expect(await screen.findByText("Question c")).toBeInTheDocument();
    expect(screen.getByText(/one guess · worth ½ point/i)).toBeInTheDocument();
    expect(newQuestion).toHaveBeenCalledWith({ guideId: "g1", taskId: "a" });
  });

  it("says so when there are no new questions left", async () => {
    open({
      a: item("a", {
        status: "locked",
        worth: 0.125,
        tries: 3,
        canReplace: false,
        reveal: { correctAnswers: [0] },
      }),
      b: item("b"),
    });
    expect(
      await screen.findByRole("button", { name: /no new questions left/i })
    ).toBeDisabled();
  });

  it("checks an answer and shows what it earned", async () => {
    open({ a: item("a"), b: item("b") });
    await screen.findByText("Question a");

    (checkAnswer as jest.Mock).mockResolvedValue({
      success: true,
      message: "",
      data: {
        item: item("a", { status: "correct", earned: 1, tries: 1, lastAnswer: [0] }),
        score: { ...score, score: 5, earnedPoints: 1, answered: 1 },
      },
    });
    fireEvent.click(screen.getByLabelText("Right option"));
    fireEvent.click(screen.getByRole("button", { name: /^check$/i }));

    expect(await screen.findByText(/correct — 1 point/i)).toBeInTheDocument();
    expect(screen.getByText("5/10")).toBeInTheDocument();
  });
});
