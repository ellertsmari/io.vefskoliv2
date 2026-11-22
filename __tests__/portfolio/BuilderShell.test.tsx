
import { fireEvent, render, screen } from "@testing-library/react";
import PortfolioBuilderPage from "../../app/LMS/portfolio/page";

jest.mock("serverActions/portfolio/getMyPortfolio", () => ({
  getMyPortfolio: jest.fn().mockResolvedValue({
    success: true,
    data: null,
  }),
}));

describe("Portfolio Builder shell", () => {
  test("shows the four steps and starts on Profile", async () => {
    render(<PortfolioBuilderPage />);

    await screen.findByText("Not published yet");

    expect(
      screen.getByRole("navigation", { name: "Portfolio builder steps" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tell your story" })
    ).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
    expect(
      screen.getByText("Profile settings will go here.")
    ).toBeInTheDocument();
  });

  test("switches to each placeholder step", async () => {
    render(<PortfolioBuilderPage />);

    await screen.findByText("Not published yet");

    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    expect(
      screen.getByRole("heading", { name: "Choose your best work" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Project selection will go here.")
    ).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(
      screen.getByRole("heading", { name: "Pick a look" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Theme settings will go here.")
    ).toBeInTheDocument();
    expect(screen.getByText("Step 3 of 4")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Contact" }));
    expect(screen.getByRole("heading", { name: "Help them reach you" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email \(optional\)/)).toBeInTheDocument();
    expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
  });

  test("shows the sample preview while forms are placeholders", async () => {
    render(<PortfolioBuilderPage />);

    await screen.findByText("Not published yet");

    expect(
      screen.getByText("DEMO PROFILE · SAMPLE DATA FROM FIGMA · NOT PUBLISHED")
    ).toBeInTheDocument();
    expect(screen.getByText("Nordic Trails")).toBeInTheDocument();
    expect(screen.getByText("Changes appear instantly")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "● Editorial" })
    ).toBeInTheDocument();
  });

  test("shows Not published yet when no portfolio exists", async () => {
    render(<PortfolioBuilderPage />);

    expect(
      await screen.findByText("Not published yet")
    ).toBeInTheDocument();
  });
});
