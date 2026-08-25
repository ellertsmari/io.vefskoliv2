import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { Grade } from "../../app/LMS/components/grading/grade/Grade";
import { returnGrade } from "serverActions/returnGrade";

jest.mock("serverActions/returnGrade", () => ({
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

  test("tells the student it is not graded yet when there is no grade", () => {
    // This used to render nothing at all, leaving an empty panel that a
    // student could not tell apart from a broken page.
    const { getByText, queryByRole } = render(
      <Grade grade={null} gradeable={false} />
    );

    expect(getByText("NOT GRADED YET")).toBeDefined();
    expect(queryByRole("slider")).toBeNull();
  });

  test("shows a grade of 0 rather than treating it as ungraded", () => {
    const { getByText, getByRole, queryByText } = render(
      <Grade grade={0} gradeable={false} />
    );

    expect(getByText("GRADE")).toBeDefined();
    expect(getByRole("slider")).toBeDefined();
    expect(queryByText("NOT GRADED YET")).toBeNull();
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

    // Suppress console.error output as there is no navigation in test environment
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementationOnce(() => {});

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
