import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { Grade } from "components/grade/Grade";
import { returnGrade } from "../../app/utils/actions";

jest.mock("../../app/utils/actions", () => ({
  returnGrade: jest.fn(),
}));

const mockUpdateGradeStatus = jest.fn();
jest.mock("../../app/providers/GuideProvider", () => ({
  useGuide: jest.fn(() => ({
    updateGradeStatus: mockUpdateGradeStatus,
  })),
}));

describe("Grade Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly when gradeable is true", () => {
    const { getByText, getByRole } = render(
      <Grade grade={null} gradeable={true} reviewId="123" />
    );

    expect(getByText("GRADE")).toBeDefined();
    expect(getByRole("slider")).toBeDefined();
    expect(getByText("SUBMIT GRADE")).toBeDefined();
  });

  test("displays null if grade and gradeable are falsy", () => {
    const { container } = render(<Grade grade={null} gradeable={false} />);

    expect(container.firstChild).toBeNull();
  });

  test("throws error if reviewId is not provided when gradeable is true", () => {
    expect(() => render(<Grade grade={null} gradeable={true} />)).toThrow(
      "Grade component requires a reviewId when gradeable is true"
    );
  });

  test("handleOnGradeChange updates tempGrade state correctly", () => {
    const { getByRole } = render(
      <Grade grade={null} gradeable={true} reviewId="123" />
    );

    const slider = getByRole("slider") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "7" } });

    () => expect(slider.value).toBe("7");
  });

  test("handleSubmit calls formAction with correct arguments", async () => {
    const { getByText, debug } = render(
      <Grade grade={3} gradeable={true} reviewId="123" />
    );

    const submitButton = getByText("SUBMIT GRADE");
    fireEvent.click(submitButton);

    await waitFor(() =>
      expect(returnGrade).toHaveBeenCalledWith(undefined, {
        grade: 3,
        reviewId: "123",
      })
    );
  });

  test("submit button is removed after successful grade submission", async () => {
    (returnGrade as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {},
    });

    const { getByText, queryByText } = render(
      <Grade grade={3} gradeable={true} reviewId="123" />
    );

    const submitButton = getByText("SUBMIT GRADE");

    await waitFor(() => {
      fireEvent.click(submitButton);
      expect(returnGrade).toHaveBeenCalledWith(undefined, {
        grade: 3,
        reviewId: "123",
      });
      expect(queryByText("SUBMIT GRADE")).toBeNull();
    });
  });
});
