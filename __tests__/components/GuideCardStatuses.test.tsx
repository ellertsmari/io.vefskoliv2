import { render } from "@testing-library/react";
import { ReviewStatus, ReturnStatus } from "../../types/guideTypes";
import { GuideCardStatuses } from "../../app/guides/components/guideCardStatuses/GuideCardStatuses";
import {
  greenTickLabel,
  purpleStarLabel,
  redCrossLabel,
  bellIconLabel,
} from "../../app/assets/iconLabels";

// NOTE: the old `gradesGivenStatus` prop (students grading each other's
// reviews) was removed from the product; these tests cover the current API.

describe("Statuses", () => {
  it("renders the correct icon and text for return status PASSED", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        reviewStatus={ReviewStatus.AWAITING_PROJECTS}
      />
    );

    expect(getByText(ReturnStatus.PASSED)).toBeInTheDocument();
    expect(getByLabelText(greenTickLabel)).toBeInTheDocument();
  });

  it("renders the correct icon and text for return status HALL_OF_FAME", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.HALL_OF_FAME}
        reviewStatus={ReviewStatus.NEED_TO_REVIEW}
      />
    );

    expect(getByText(ReturnStatus.HALL_OF_FAME)).toBeInTheDocument();
    expect(getByLabelText(purpleStarLabel)).toBeInTheDocument();
  });

  it("renders the correct icon and text for return status FAILED", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.FAILED}
        reviewStatus={ReviewStatus.REVIEWS_GIVEN}
      />
    );

    expect(getByText(ReturnStatus.FAILED)).toBeInTheDocument();
    expect(getByLabelText(redCrossLabel)).toBeInTheDocument();
  });

  it("renders null if return status NOT_RETURNED", () => {
    const { container } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.NOT_RETURNED}
        reviewStatus={ReviewStatus.REVIEWS_GIVEN}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the correct icon and text for review status NEED_TO_REVIEW", () => {
    const { getByText, getByLabelText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        reviewStatus={ReviewStatus.NEED_TO_REVIEW}
      />
    );

    expect(getByText(ReviewStatus.NEED_TO_REVIEW)).toBeInTheDocument();
    expect(getByLabelText(bellIconLabel)).toBeInTheDocument();
  });

  it("does not render grade when status is NEED_TO_REVIEW", () => {
    const grade = 10;
    const { queryByText } = render(
      <GuideCardStatuses
        returnStatus={ReturnStatus.PASSED}
        reviewStatus={ReviewStatus.NEED_TO_REVIEW}
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
        reviewStatus={ReviewStatus.REVIEWS_GIVEN}
        grade={grade}
      />
    );

    expect(getByText(grade)).toBeInTheDocument();
  });
});
