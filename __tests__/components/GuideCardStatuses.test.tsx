import { render } from "@testing-library/react";
import {
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "../../types/guideTypes";
import { GuideCardStatuses } from "../../app/guides/components/guideCardStatuses/GuideCardStatuses";
import { exportedForTesting } from "../../app/assets/Icons";

describe("Statuses", () => {
  it("renders the correct icon and text for return status PASSED", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        feedbackStatus={FeedbackStatus.AWAITING_PROJECTS}
        gradesGivenStatus={GradesGivenStatus.AWAITING_FEEDBACK}
      />
    );

    expect(getByText(ReturnStatus.PASSED)).toBeInTheDocument();
    expect(
      getByLabelText(exportedForTesting.greenTickLabel)
    ).toBeInTheDocument();
  });

  it("renders the correct icon and text for return status HALL_OF_FAME", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.HALL_OF_FAME}
        feedbackStatus={FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK}
        gradesGivenStatus={GradesGivenStatus.AWAITING_FEEDBACK}
      />
    );

    expect(getByText(ReturnStatus.HALL_OF_FAME)).toBeInTheDocument();
    expect(
      getByLabelText(exportedForTesting.purpleStarLabel)
    ).toBeInTheDocument();
  });

  it("renders the correct icon and text for return status FAILED", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.FAILED}
        feedbackStatus={FeedbackStatus.FEEDBACK_GIVEN}
        gradesGivenStatus={GradesGivenStatus.AWAITING_FEEDBACK}
      />
    );

    expect(getByText(ReturnStatus.FAILED)).toBeInTheDocument();
    expect(
      getByLabelText(exportedForTesting.redCrossLabel)
    ).toBeInTheDocument();
  });

  it("renders null if return status NOT_RETURNED", () => {
    const { container } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.NOT_RETURNED}
        feedbackStatus={FeedbackStatus.FEEDBACK_GIVEN}
        gradesGivenStatus={GradesGivenStatus.AWAITING_FEEDBACK}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the correct icon and text for feedback status NEED_TO_PROVIDE_FEEDBACK", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        feedbackStatus={FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK}
        gradesGivenStatus={GradesGivenStatus.NEED_TO_GRADE}
      />
    );

    expect(
      getByText(FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK)
    ).toBeInTheDocument();
    expect(
      getByLabelText(exportedForTesting.bellIconLabel)
    ).toBeInTheDocument();
  });

  it("renders the correct icon and text when NEED_TO_GRADE", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        feedbackStatus={FeedbackStatus.FEEDBACK_GIVEN}
        gradesGivenStatus={GradesGivenStatus.NEED_TO_GRADE}
      />
    );

    expect(getByText(GradesGivenStatus.NEED_TO_GRADE)).toBeInTheDocument();
    expect(
      getByLabelText(exportedForTesting.bellIconLabel)
    ).toBeInTheDocument();
  });

  it("does not render grade when provided but status is NEED_TO_GRADE", () => {
    const grade = 10;
    const { queryByText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        feedbackStatus={FeedbackStatus.FEEDBACK_GIVEN}
        gradesGivenStatus={GradesGivenStatus.NEED_TO_GRADE}
        grade={grade}
      />
    );

    expect(queryByText(grade)).toBeNull();
  });

  it("does not render grade when provided but status is NEED_TO_PROVIDE_FEEDBACK", () => {
    const grade = 10;
    const { queryByText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        feedbackStatus={FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK}
        gradesGivenStatus={GradesGivenStatus.NEED_TO_GRADE}
        grade={grade}
      />
    );

    expect(queryByText(grade)).toBeNull();
  });

  it("renders grade when provided", () => {
    const grade = 10;
    const { getByText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        feedbackStatus={FeedbackStatus.FEEDBACK_GIVEN}
        gradesGivenStatus={GradesGivenStatus.GRADES_GIVEN}
        grade={grade}
      />
    );

    expect(getByText(grade)).toBeInTheDocument();
  });
});
