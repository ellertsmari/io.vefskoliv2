import { render, screen } from "@testing-library/react";
import { ExerciseLauncher } from "../../app/guides/components/exercise/ExerciseLauncher";
import type { ExerciseSummary } from "serverActions/exerciseSession";

jest.mock("serverActions/exerciseSession", () => ({
  startExercise: jest.fn(),
  checkAnswer: jest.fn(),
  finishExercise: jest.fn(),
  getExerciseSummary: jest.fn(),
  getAttemptReview: jest.fn(),
}));

const summary = (over: Partial<ExerciseSummary> = {}): ExerciseSummary => ({
  status: "notStarted",
  bestScore: null,
  passed: false,
  attemptCount: 0,
  answered: 0,
  total: 21,
  ...over,
});

describe("ExerciseLauncher", () => {
  it("offers a way back to a finished attempt", () => {
    render(
      <ExerciseLauncher
        guideId="g1"
        summary={summary({ status: "canImprove", bestScore: 5, attemptCount: 2 })}
      />
    );
    expect(
      screen.getByRole("button", { name: /review your last attempt/i })
    ).toBeInTheDocument();
  });

  it("does not offer a review before anything has been finished", () => {
    render(<ExerciseLauncher guideId="g1" summary={summary()} />);
    expect(
      screen.queryByRole("button", { name: /review your last attempt/i })
    ).not.toBeInTheDocument();
  });

  it("offers the review from the perfect state too", () => {
    render(
      <ExerciseLauncher
        guideId="g1"
        summary={summary({ status: "perfect", bestScore: 10, passed: true, attemptCount: 3 })}
      />
    );
    expect(
      screen.getByRole("button", { name: /review your last attempt/i })
    ).toBeInTheDocument();
  });

  /**
   * The review button shipped invisible: it used the design system's
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
        summary={summary({ status: "canImprove", bestScore: 5, attemptCount: 1 })}
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
