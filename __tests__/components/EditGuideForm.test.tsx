/**
 * @jest-environment jsdom
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { EditGuideForm } from "app/components/editGuides/EditGuideForm";
import type { GuideType } from "models/guide";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));
// The markdown editor is loaded lazily and needs a browser; a textarea stands
// in for it so the board around it can be exercised.
jest.mock("next/dynamic", () => () => {
  const Stub = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea aria-label="markdown" value={value} onChange={(e) => onChange(e.target.value)} />
  );
  return Stub;
});
jest.mock("UIcomponents/markdown/reader", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div data-testid="preview">{children}</div>,
}));

const guide = {
  _id: "5f12e46eb92a3e0782418196",
  title: "HTML & CSS - Layouting",
  description: "# Layout",
  topicsList: "flex, grid",
  order: 3,
  themeIdea: { title: "A landing page", description: "Build one" },
  module: { title: "3 - The fundamentals", number: 3 },
  knowledge: [{ knowledge: "Flexbox" }],
  skills: [],
  resources: [],
  classes: [],
  references: [],
  gradingMode: "peerReview",
} as unknown as GuideType;

describe("EditGuideForm", () => {
  // The form keeps a draft in localStorage; one test's edits must not be
  // restored into the next.
  afterEach(() => window.localStorage.clear());

  it("lays the guide out as tiles with the title in the header", () => {
    render(<EditGuideForm guide={guide} />);

    expect(screen.getByLabelText("Guide title")).toHaveValue("HTML & CSS - Layouting");
    for (const tile of ["Description", "Idea for return", "Topics", "Goals", "Materials"]) {
      expect(screen.getByLabelText(tile)).toBeInTheDocument();
    }
    expect(screen.queryByLabelText("Exercise")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Flexbox")).toBeInTheDocument();
  });

  it("shows the exercise tile only for auto-graded guides", () => {
    render(<EditGuideForm guide={guide} />);

    fireEvent.change(screen.getByLabelText(/How it is completed/), { target: { value: "auto" } });

    expect(screen.getByLabelText("Exercise")).toBeInTheDocument();
  });

  it("opens one text full screen with a preview and comes back on Escape", () => {
    render(<EditGuideForm guide={guide} />);

    fireEvent.click(screen.getByLabelText("Open Description full screen"));
    const dialog = screen.getByRole("dialog", { name: "Editing Description" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("preview")).toHaveTextContent("# Layout");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("refuses to save an incomplete guide and says what is missing", async () => {
    // jsdom has no fetch of its own; anything that reaches it is a failure.
    const fetchSpy = jest.fn().mockResolvedValue({ ok: true });
    (global as { fetch?: unknown }).fetch = fetchSpy;
    render(<EditGuideForm guide={guide} />);

    // The description is not a native required field, so only the form's own
    // check can catch it (the title's emptiness the browser catches first).
    fireEvent.change(screen.getAllByLabelText("markdown")[0], { target: { value: " " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/description/);
    expect(fetchSpy).not.toHaveBeenCalled();
    delete (global as { fetch?: unknown }).fetch;
  });
});
