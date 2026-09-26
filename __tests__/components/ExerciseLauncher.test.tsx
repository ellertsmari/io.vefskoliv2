import { fireEvent, render, screen } from "@testing-library/react";
import { ExerciseLauncher } from "../../app/guides/components/exercise/ExerciseLauncher";
import {
  getExerciseSummary,
  openExercise,
  type ExerciseSummary,
} from "serverActions/exerciseSession";

jest.mock("serverActions/exerciseSession", () => ({
  openExercise: jest.fn(),
  checkAnswer: jest.fn(),
  newQuestion: jest.fn(),
  getExerciseSummary: jest.fn(),
}));

const summary = (over: Partial<ExerciseSummary> = {}): ExerciseSummary => ({
  status: "notStarted",
  score: null,
  passed: false,
  passThreshold: 0.7,
  answered: 0,
  total: 21,
  ...over,
});

describe("ExerciseLauncher", () => {
  /**
   * The pass mark was never shown. A student with 6.4/10 saw "not passed" and,
   * used to 5 being a pass on peer-reviewed guides, took it for a bug.
   */
  it("states the pass mark on the same scale as the score", () => {
    render(
      <ExerciseLauncher
        guideId="g1"
        summary={summary({ status: "inProgress", score: 6.4, answered: 12 })}
      />
    );
    expect(screen.getByText(/you need 7\/10 to pass/i)).toBeInTheDocument();
    expect(
      screen.getByText(/not passed yet — you need 7\/10/i)
    ).toBeInTheDocument();
  });

  /** There is one attempt and it never closes: never "try again". */
  it("only ever offers to start or continue", () => {
    const { unmount } = render(
      <ExerciseLauncher guideId="g1" summary={summary()} />
    );
    expect(
      screen.getByRole("button", { name: /start the exercise/i })
    ).toBeInTheDocument();
    unmount();

    render(
      <ExerciseLauncher
        guideId="g1"
        summary={summary({ status: "passed", score: 8, passed: true, answered: 20 })}
      />
    );
    expect(
      screen.getByRole("button", { name: /continue the exercise/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/new attempt|try again/i)).not.toBeInTheDocument();
  });

  /**
   * Closing the exercise part way through left the card saying "Start the
   * exercise", as if nothing had been saved.
   */
  it("shows the saved progress after the exercise is closed", async () => {
    (openExercise as jest.Mock).mockReturnValue(new Promise(() => {}));
    (getExerciseSummary as jest.Mock).mockResolvedValue(
      summary({ status: "inProgress", score: 3, answered: 8 })
    );
    render(<ExerciseLauncher guideId="g1" summary={summary()} />);

    fireEvent.click(screen.getByRole("button", { name: /start the exercise/i }));
    fireEvent.click(screen.getByTestId("modal-wrapper"));

    expect(
      await screen.findByRole("button", { name: /continue the exercise/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/8 of 21 answered/i)).toBeInTheDocument();
  });

  /**
   * A launcher button once shipped invisible: it used the design system's
   * `textButton`, which is white text intended for dark backgrounds, on a white
   * card. It rendered, took up space, and could not be seen.
   *
   * jsdom does not resolve CSS variables, so getComputedStyle is no use here —
   * it returns "ButtonText" whatever the variant. This reads the CSS
   * styled-components actually generated for the button's own class instead.
   */
  it("does not put white text on the white card", () => {
    const { container } = render(
      <ExerciseLauncher
        guideId="g1"
        summary={summary({ status: "inProgress", score: 5, answered: 4 })}
      />
    );

    const css = Array.from(document.querySelectorAll("style"))
      .map((tag) => tag.textContent ?? "")
      .join("");

    // White text is fine on the black `default` button. The bug is white text
    // with nothing dark behind it.
    const invisible = Array.from(container.querySelectorAll("button"))
      .flatMap((button) => Array.from(button.classList))
      .filter((className) => {
        const rule = new RegExp(`\\.${className}\\{([^}]*)\\}`).exec(css);
        if (!rule) return false;
        const declarations = rule[1];
        return (
          /color:\s*var\(--primary-white\)/.test(declarations) &&
          /background-color:\s*transparent/.test(declarations)
        );
      });

    expect(invisible).toEqual([]);
  });
});
