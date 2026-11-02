import { render, screen } from "@testing-library/react";
import Gallery from "app/components/gallery/Gallery";

const sampleItems = [
  {
    returnId: "1",
    title: "Moon Landing",
    description: "A small but ambitious web project showcasing a landing page for a moon mission.",
    studentName: "Anna Student",
    module: { number: 1, title: "Module 1" },
    guideTitle: "Moon mission landing page",
    recommendationCount: 2,
    returnImage: null,
    returnGif: null,
    returnUrl: "https://example.com/project",
    projectUrl: null,
    liveVersion: "https://example.com/project",
    topics: [],
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

describe("Gallery controls", () => {
  it("hides search and filters when controls are disabled", () => {
    render(<Gallery items={sampleItems} showControls={false} />);

    expect(screen.queryByPlaceholderText("Search by project, student or module")).toBeNull();
    expect(screen.queryByLabelText("Filter by module")).toBeNull();
  });

  it("shows search and filters when controls are enabled", () => {
    render(<Gallery items={sampleItems} showControls />);

    expect(screen.getByPlaceholderText("Search by project, student or module")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by module")).toBeInTheDocument();
  });
});
