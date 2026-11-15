import { fireEvent, render, screen } from "@testing-library/react";
import PortfolioBuilderPage from "../../app/LMS/portfolio/page";

describe("Portfolio Builder shell", () => {
  test("shows the four steps and starts on Profile", () => {
    render(<PortfolioBuilderPage />);

    expect(screen.getByRole("navigation", { name: "Portfolio builder steps" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Tell your story" })).toBeDefined();
    expect(screen.getByText("Step 1 of 4")).toBeDefined();
    expect(screen.getByText("Profile settings will go here.")).toBeDefined();
  });

  test("switches to each placeholder step", () => {
    render(<PortfolioBuilderPage />);

    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(screen.getByRole("heading", { name: "Choose your best work" })).toBeDefined();
    expect(screen.getByText("Project selection will go here.")).toBeDefined();
    expect(screen.getByText("Step 2 of 4")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.getByRole("heading", { name: "Pick a look" })).toBeDefined();
    expect(screen.getByText("Theme settings will go here.")).toBeDefined();
    expect(screen.getByText("Step 3 of 4")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    expect(screen.getByRole("heading", { name: "Help them reach you" })).toBeDefined();
    expect(screen.getByText("Contact settings will go here.")).toBeDefined();
    expect(screen.getByText("Step 4 of 4")).toBeDefined();
  });

  test("shows the sample preview while forms are placeholders", () => {
    render(<PortfolioBuilderPage />);
    expect(screen.getByText("DEMO PROFILE · SAMPLE DATA FROM FIGMA · NOT PUBLISHED")).toBeDefined();
    expect(screen.getByText("Nordic Trails")).toBeDefined();
    expect(screen.getByText("Changes appear instantly")).toBeDefined();
    expect(screen.getByRole("button", { name: "● Editorial" })).toBeDefined();
  });
});
