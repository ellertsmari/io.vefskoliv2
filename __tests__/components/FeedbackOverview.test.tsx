import { fireEvent, render, screen } from "@testing-library/react";
import { useGuide } from "../../app/providers/GuideProvider";
import { FeedbackOverview } from "components/guideCard/FeedbackOverview";
import { FeedbackDocumentWithReturn } from "../../app/guides/types";
import { ReturnDocument } from "../../app/models/return";
import { FeedbackDocument } from "../../app/models/review";
import { ReturnOverview } from "components/guideCard/ReturnOverview";

jest.mock("../../app/providers/GuideProvider");

jest.mock("components/markdown/reader", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

function createMockFeedbacks(
  count: number,
  givenOrReceived: "given" | "received" = "given"
): FeedbackDocument[] {
  if (count < 1) {
    return [];
  }
  const feedbacks: FeedbackDocumentWithReturn[] = [];

  for (let i = 0; i < count; i++) {
    const feedback: FeedbackDocumentWithReturn = {
      grade: i,
      comment: `Feedback ${givenOrReceived} comment${i}`,
    } as FeedbackDocument;

    feedbacks.push(feedback);
  }

  return feedbacks;
}

function createMockFeedbacksWithReturn(
  count: number,
  givenOrReceived: "given" | "received" = "given"
): FeedbackDocumentWithReturn[] {
  if (count < 1) {
    return [];
  }
  const feedbacks = createMockFeedbacks(
    count,
    givenOrReceived
  ) as FeedbackDocumentWithReturn[];

  feedbacks.forEach((feedback, index) => {
    feedback.associatedReturn = {
      projectName: `Project ${givenOrReceived} name ${index}`,
      comment: `Project ${givenOrReceived} comment ${index}`,
      projectUrl: `projectUrl ${givenOrReceived} ${index}`,
      liveVersion: `liveVersion ${givenOrReceived} ${index}`,
    } as ReturnDocument;
  });

  return feedbacks;
}

const returnsSubmitted = ["a return"];

describe("Feedback", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("renders without crashing", () => {
    (useGuide as jest.Mock).mockReturnValue({
      feedbackGiven: [],
      feedbackReceived: [],
      returnsSubmitted,
    });

    render(<FeedbackOverview />);
  });

  it("renders feedback", () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(3);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(3);

    (useGuide as jest.Mock).mockReturnValue({
      feedbackGiven: mockFeedbackGiven,
      feedbackReceived: mockFeedbackReceived,
      returnsSubmitted,
    });

    const { getByText, debug } = render(<FeedbackOverview />);
    expect(
      getByText(mockFeedbackGiven[0].associatedReturn!.projectName)
    ).toBeDefined();
    expect(
      getByText(mockFeedbackGiven[0].associatedReturn!.comment)
    ).toBeDefined();
    expect(getByText(mockFeedbackGiven[0].comment)).toBeDefined();

    const projectUrlLink = screen.getByRole("link", {
      name: /Github or Figma URL/i,
    });
    expect(projectUrlLink).toBeDefined();
    expect(projectUrlLink.getAttribute("href")).toBe(
      mockFeedbackGiven[0].associatedReturn!.projectUrl
    );

    const liveVersionLink = screen.getByRole("link", {
      name: /Live version or prototype \(Figma\)/i,
    });
    expect(liveVersionLink).toBeDefined();
    expect(liveVersionLink.getAttribute("href")).toBe(
      mockFeedbackGiven[0].associatedReturn!.liveVersion
    );
  });

  it('toggles between "given" and "received" correctly', () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(3);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(3, "received");

    (useGuide as jest.Mock).mockReturnValue({
      feedbackGiven: mockFeedbackGiven,
      feedbackReceived: mockFeedbackReceived,
      returnsSubmitted,
    });

    const { getByRole, getByText, queryByText, debug } = render(
      <FeedbackOverview />
    );

    const firstFeedbackGiven = queryByText(mockFeedbackGiven[0].comment);
    const firstFeedbackReceived = queryByText(mockFeedbackReceived[0].comment);

    expect(firstFeedbackGiven).toBeNull();
    expect(firstFeedbackReceived).toBeDefined();

    const receivedToggle = getByRole("button", { name: /received/i });
    const givenToggle = getByRole("button", { name: /given/i });

    fireEvent.click(givenToggle);

    expect(firstFeedbackReceived).toBeDefined();
    expect(firstFeedbackGiven).toBeNull();

    fireEvent.click(receivedToggle);

    expect(firstFeedbackReceived).toBeDefined();
    expect(firstFeedbackGiven).toBeNull();
  });

  it("OptionNavigator changes the displayed feedback when a different option is selected", () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(3);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(3, "received");

    (useGuide as jest.Mock).mockReturnValue({
      feedbackGiven: mockFeedbackGiven,
      feedbackReceived: mockFeedbackReceived,
      returnsSubmitted,
    });

    const { getByText, queryByText } = render(<FeedbackOverview />);

    // Click the "next" button in the OptionNavigator
    const nextButton = screen.getByRole("button", {
      name: "Select Next Option",
    });
    fireEvent.click(nextButton);

    // Check that the second feedback given is now displayed
    const secondFeedbackReceived = getByText(mockFeedbackReceived[1].comment);
    expect(secondFeedbackReceived).toBeDefined();

    // Check that the first feedback given is not displayed
    const firstFeedbackGiven = queryByText(mockFeedbackReceived[0].comment);
    expect(firstFeedbackGiven).toBeNull();

    // go to given feedback
    const givenToggle = screen.getByRole("button", { name: /given/i });
    fireEvent.click(givenToggle);

    // Click the "previous" button in the OptionNavigator
    const NextButton = screen.getByRole("button", {
      name: "Select Next Option",
    });
    fireEvent.click(NextButton);
    expect(getByText(mockFeedbackGiven[1].comment)).toBeDefined();
  });
});
