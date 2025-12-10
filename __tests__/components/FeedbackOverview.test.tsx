import { fireEvent, render, screen } from "@testing-library/react";
import { useGuide } from "providers/GuideProvider";
import { FeedbackOverview } from "../../app/LMS/components/feedback/feedbackOverview/FeedbackOverview";
import { FeedbackDocumentWithReturn } from "types/guideTypes";
import { ReturnDocument } from "models/return";
import { FeedbackDocument } from "models/review";
import { Types } from "mongoose";

jest.mock("serverActions/returnGuide", () => ({
  returnGuide: jest.fn(),
}));

jest.mock("providers/GuideProvider");

jest.mock("UIcomponents/markdown/reader", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("../../auth", () => ({
  auth: jest.fn(),
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
      _id: new Types.ObjectId(),
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

const returnsSubmitted = [
  { projectUrl: "a link to project", liveVersion: "link to live version" },
];

// Base mock guide data with all required fields
const createMockGuide = (overrides = {}) => ({
  feedbackGiven: [],
  feedbackReceived: [],
  returnsSubmitted,
  link: "someLink",
  returnStatus: "awaiting feedback",
  availableForFeedback: [],
  ...overrides,
});

describe("Feedback", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("renders without crashing", () => {
    (useGuide as jest.Mock).mockReturnValue({
      guide: createMockGuide(),
    });

    render(<FeedbackOverview />);
  });

  it("renders feedback", () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(3);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(3);

    (useGuide as jest.Mock).mockReturnValue({
      guide: createMockGuide({
        feedbackGiven: mockFeedbackGiven,
        feedbackReceived: mockFeedbackReceived,
      }),
    });

    const { getByText, debug } = render(<FeedbackOverview />);
    if (!mockFeedbackGiven[0].associatedReturn) throw new Error("No return");
    expect(
      getByText(mockFeedbackGiven[0].associatedReturn.projectName)
    ).toBeDefined();
    expect(
      getByText(mockFeedbackGiven[0].associatedReturn.comment)
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
      guide: createMockGuide({
        feedbackGiven: mockFeedbackGiven,
        feedbackReceived: mockFeedbackReceived,
      }),
    });

    const { getByRole, queryByText } = render(<FeedbackOverview />);

    // Initial state
    expect(queryByText(mockFeedbackGiven[0].comment)).toBeNull();
    expect(queryByText(mockFeedbackReceived[0].comment)).toBeDefined();

    const receivedToggle = getByRole("button", { name: /received/i });
    const givenToggle = getByRole("button", { name: /given/i });

    // Toggle to "given"
    fireEvent.click(givenToggle);
    expect(queryByText(mockFeedbackReceived[0].comment)).toBeNull();
    expect(queryByText(mockFeedbackGiven[0].comment)).toBeDefined();

    // Toggle back to "received"
    fireEvent.click(receivedToggle);
    expect(queryByText(mockFeedbackReceived[0].comment)).toBeDefined();
    expect(queryByText(mockFeedbackGiven[0].comment)).toBeNull();
  });

  it("OptionNavigator changes the displayed feedback when a different option is selected", () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(3);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(3, "received");

    (useGuide as jest.Mock).mockReturnValue({
      guide: createMockGuide({
        feedbackGiven: mockFeedbackGiven,
        feedbackReceived: mockFeedbackReceived,
      }),
    });

    const { getByText, queryByText } = render(<FeedbackOverview />);

    // Click "Option 2" button in the OptionNavigator
    const option2Button = screen.getByRole("button", {
      name: "Select Option 2",
    });
    fireEvent.click(option2Button);

    // Check that the second feedback received is now displayed
    const secondFeedbackReceived = getByText(mockFeedbackReceived[1].comment);
    expect(secondFeedbackReceived).toBeDefined();

    // Check that the first feedback received is not displayed
    const firstFeedbackReceived = queryByText(mockFeedbackReceived[0].comment);
    expect(firstFeedbackReceived).toBeNull();

    // go to given feedback
    const givenToggle = screen.getByRole("button", { name: /given/i });
    fireEvent.click(givenToggle);

    // Click "Option 2" button in the OptionNavigator for given feedback
    const option2ButtonGiven = screen.getByRole("button", {
      name: "Select Option 2",
    });
    fireEvent.click(option2ButtonGiven);
    expect(getByText(mockFeedbackGiven[1].comment)).toBeDefined();
  });

  it("shows grade if feedback given and received a grade", () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(1);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(1, "received");
    mockFeedbackGiven[0].grade = 5;

    (useGuide as jest.Mock).mockReturnValue({
      guide: createMockGuide({
        feedbackGiven: mockFeedbackGiven,
        feedbackReceived: mockFeedbackReceived,
      }),
    });

    const { getByText, debug } = render(<FeedbackOverview />);

    const givenToggle = screen.getByRole("button", { name: /given/i });
    fireEvent.click(givenToggle);

    expect(getByText("GRADE")).toBeDefined();
  });

  it("does not show grade if feedback given but not received a grade", () => {
    const mockFeedbackGiven = createMockFeedbacksWithReturn(1);
    const mockFeedbackReceived = createMockFeedbacksWithReturn(1, "received");

    (useGuide as jest.Mock).mockReturnValue({
      guide: createMockGuide({
        feedbackGiven: mockFeedbackGiven,
        feedbackReceived: mockFeedbackReceived,
      }),
    });

    const { queryByText } = render(<FeedbackOverview />);

    const receivedToggle = screen.getByRole("button", { name: /given/i });
    fireEvent.click(receivedToggle);

    expect(queryByText("GRADE")).toBeNull();
  });
});
