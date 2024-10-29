import React from "react";
import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import GuideCard from "components/guideCard/GuideCard";
import {
  clearDatabase,
  connect,
  closeDatabase,
  createDummyExtendedGuides,
  createDummyGuide,
  createDummyUser,
  createDummyReturn,
  createDummyFetchedGuides,
  createDummyFetchedGuideWithControl,
  createDummyFetchedGuidedWithNoReturn,
} from "../__mocks__/mongoHandler";
import {
  FeedbackStatus,
  GradesGivenStatus,
  ReturnStatus,
} from "../../types/guideTypes";
import exp from "constants";

const mockGuide = {
  returnStatus: ReturnStatus.NOT_RETURNED,
  feedbackStatus: FeedbackStatus.NEED_TO_PROVIDE_FEEDBACK,
  gradesGivenStatus: GradesGivenStatus.NEED_TO_GRADE,
  grade: "A",
  link: "http://example.com",
  module: { title: ["Module Title"] },
  title: "Guide Title",
};

describe("GuideCard", () => {
  beforeAll(async () => await connect());
  afterAll(async () => await closeDatabase());

  afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
  });

  it("renders", async () => {
    const user = await createDummyUser();
    const guides = await createDummyExtendedGuides(user, 1);
    const guide = guides[0];
    render(<GuideCard guide={guide} order={1} />);

    expect(screen.getByText(guide.title)).toBeDefined();
  });

  it("renders a link if the guide has not been returned", async () => {
    const user1 = await createDummyUser();
    const guide = await createDummyFetchedGuidedWithNoReturn(user1);

    const { getByRole } = render(<GuideCard guide={guide} order={1} />);
    const link = getByRole("link");
    expect(link).toHaveAttribute("href", guide.link);
    expect(link).toBeDefined();
  });

  it("does not render a link if the guide has been returned", async () => {
    const user = await createDummyUser();
    const guide = await createDummyFetchedGuideWithControl(user, {});
    const { queryByRole } = render(<GuideCard guide={guide} order={1} />);
    const link = queryByRole("link");
    expect(link).toBeNull();
  });

  it("does not render a notification icon if no need to grade or give feedback", async () => {
    const user = await createDummyUser();
    const guide = await createDummyFetchedGuideWithControl(user, {});
    const { queryByLabelText, debug } = render(
      <GuideCard guide={guide} order={1} />
    );
    const notificationIcon = queryByLabelText("Notification icon");
    expect(notificationIcon).toBeNull();
  });

  it("renders a notification icon if need to grade", async () => {
    const user = await createDummyUser();
    const guide = await createDummyFetchedGuideWithControl(user, {
      availableToGrade: 1,
    });
    const { getByLabelText } = render(<GuideCard guide={guide} order={1} />);
    const notificationIcon = getByLabelText("Notification icon");
    expect(notificationIcon).toBeDefined();
  });

  it("renders a notification icon if need to give feedback", async () => {
    const user = await createDummyUser();
    const guide = await createDummyFetchedGuideWithControl(user, {
      availableForFeedback: 1,
    });
    const { getByLabelText } = render(<GuideCard guide={guide} order={1} />);
    const notificationIcon = getByLabelText("Notification icon");
    expect(notificationIcon).toBeDefined();
  });
});
