import React from "react";
import { render } from "@testing-library/react";
import { GuideCardOverview } from "../../app/guides/components/guideCardOverview/GuideCardOverview";
import {
  ReturnStatus,
  ReviewStatus,
  GradesGivenStatus,
} from "../../types/guideTypes";

describe("GuideCardOverview", () => {
  it("renders the guide title", () => {
    const { getByText } = render(
      <GuideCardOverview
        guideTitle="Test Guide"
        moduleTitle="Test Module"
        order={1}
        link="http://example.com"
        returnStatus={ReturnStatus.NOT_RETURNED}
        reviewStatus={ReviewStatus.REVIEWS_GIVEN}
        gradesGivenStatus={GradesGivenStatus.AWAITING_REVIEWS}
      />
    );

    expect(getByText("Test Guide")).toBeInTheDocument();
  });

  it("has a link to the guide if provided", () => {
    const linkText = "http://example.com";
    const { queryByRole } = render(
      <GuideCardOverview
        guideTitle="Test Guide"
        moduleTitle="Test Module"
        order={1}
        link={linkText}
        returnStatus={ReturnStatus.NOT_RETURNED}
        reviewStatus={ReviewStatus.REVIEWS_GIVEN}
        gradesGivenStatus={GradesGivenStatus.AWAITING_REVIEWS}
      />
    );

    const link = queryByRole("link");

    expect(link).toHaveAttribute("href", linkText);
  });
  it("does not have a link to the guide if not provided", () => {
    const { queryByRole } = render(
      <GuideCardOverview
        guideTitle="Test Guide"
        moduleTitle="Test Module"
        order={1}
        returnStatus={ReturnStatus.NOT_RETURNED}
        reviewStatus={ReviewStatus.REVIEWS_GIVEN}
        gradesGivenStatus={GradesGivenStatus.AWAITING_REVIEWS}
      />
    );

    const link = queryByRole("link");

    expect(link).toBeNull();
  });
});
