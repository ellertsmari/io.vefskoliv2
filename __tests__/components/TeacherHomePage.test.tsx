/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TeacherHomePage } from "../../app/components/teacherHome/TeacherHomePage";

jest.mock("serverActions/getUngradedReviews", () => ({
  getUngradedReviews: jest.fn(),
}));
jest.mock("serverActions/returnGrade", () => ({
  returnGrade: jest.fn(),
}));
jest.mock("serverActions/getAnalyticsHeadline", () => ({
  getAnalyticsHeadline: jest.fn().mockResolvedValue(null),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));
// The meetings panel has its own server action and its own tests.
jest.mock("../../app/components/teacherHome/MeetingsPanel", () => ({
  MeetingsPanel: () => null,
}));
jest.mock("UIcomponents/markdown/reader", () => ({
  __esModule: true,
  default: ({ children }: any) => <div>{children}</div>,
}));

import { getUngradedReviews } from "serverActions/getUngradedReviews";
import { returnGrade } from "serverActions/returnGrade";
import { getAnalyticsHeadline } from "serverActions/getAnalyticsHeadline";

const ungradedReview = (id: string, reviewer: string) => ({
  _id: id,
  comment: `Review ${id}: clear structure, good use of semantic tags.`,
  vote: "pass",
  createdAt: new Date("2026-09-08T15:48:00Z"),
  guide: { _id: "g1", title: "HTML & CSS - Layouting", category: "code" },
  return: {
    _id: `return-${id}`,
    projectName: "Poster",
    projectUrl: "https://github.com/example/poster",
    liveVersion: "https://example.github.io/poster",
  },
  reviewer: { _id: `u-${reviewer}`, name: reviewer },
  returnOwner: { _id: "u-author", name: "Author" },
});

describe("TeacherHomePage grading queue", () => {
  afterEach(() => jest.clearAllMocks());

  it("counts the queue on the card and drops it as reviews are graded", async () => {
    (getUngradedReviews as jest.Mock).mockResolvedValue([
      ungradedReview("r1", "Aretha"),
      ungradedReview("r2", "Valdís"),
    ]);
    (returnGrade as jest.Mock).mockResolvedValue({
      success: true,
      message: "Grade submitted successfully",
    });

    render(<TeacherHomePage />);

    await screen.findByText("2 reviews waiting to be graded");

    fireEvent.click(screen.getByText("Grade reviews"));
    await screen.findByText("Grade Reviews");
    expect(screen.getAllByText("Grade")).toHaveLength(2);

    fireEvent.click(screen.getAllByText("Grade")[0]);

    // The card used to keep showing the number from page load until a reload;
    // the modal now reports what is left after every grade.
    await waitFor(() =>
      expect(screen.getAllByText("1 review waiting to be graded")).toHaveLength(2)
    );
    expect(screen.getAllByText("Grade")).toHaveLength(1);
    expect(returnGrade).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ reviewId: "r1" })
    );
  });

  it("re-syncs the card when the modal loads a changed queue", async () => {
    // Another teacher graded two reviews since this page was loaded.
    (getUngradedReviews as jest.Mock)
      .mockResolvedValueOnce([
        ungradedReview("r1", "Aretha"),
        ungradedReview("r2", "Valdís"),
        ungradedReview("r3", "Ingvar"),
      ])
      .mockResolvedValueOnce([ungradedReview("r3", "Ingvar")]);

    render(<TeacherHomePage />);

    await screen.findByText("3 reviews waiting to be graded");

    fireEvent.click(screen.getByText("Grade reviews"));

    await waitFor(() =>
      expect(screen.getAllByText("1 review waiting to be graded")).toHaveLength(2)
    );
    expect(screen.queryByText("3 reviews waiting to be graded")).toBeNull();
  });

  it("says when nothing is waiting", async () => {
    (getUngradedReviews as jest.Mock).mockResolvedValue([]);

    render(<TeacherHomePage />);

    await screen.findByText("Everything is graded — nothing waiting");
  });
});

describe("TeacherHomePage analytics card", () => {
  beforeEach(() => {
    (getUngradedReviews as jest.Mock).mockResolvedValue([]);
  });
  afterEach(() => jest.clearAllMocks());

  it("links to the dashboard with last week's numbers", async () => {
    (getAnalyticsHeadline as jest.Mock).mockResolvedValue({
      days: 7,
      visitors: 1284,
      views: 1,
      collectingSince: "2026-10-01",
    });

    render(<TeacherHomePage />);

    const line = await screen.findByText("1,284 visitors, 1 view in the last 7 days");
    expect(line.closest("a")).toHaveAttribute("href", "/LMS/analytics");
  });

  it("says so before the first visit is recorded", async () => {
    (getAnalyticsHeadline as jest.Mock).mockResolvedValue({
      days: 7,
      visitors: 0,
      views: 0,
      collectingSince: null,
    });

    render(<TeacherHomePage />);

    await screen.findByText("No public visits recorded yet");
  });

  it("keeps a working link when the numbers can't be read", async () => {
    (getAnalyticsHeadline as jest.Mock).mockRejectedValue(new Error("db down"));

    render(<TeacherHomePage />);

    await screen.findByText("Everything is graded — nothing waiting");
    expect(screen.getByText("Public visitors and crawlers").closest("a")).toHaveAttribute(
      "href",
      "/LMS/analytics"
    );
  });
});
