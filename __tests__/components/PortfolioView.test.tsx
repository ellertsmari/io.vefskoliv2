/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { PortfolioView } from "app/components/portfolio/view/PortfolioView";
import { mockPublicPortfolio } from "utils/portfolio/mockPortfolio";
import type { PublicPortfolio } from "types/portfolioTypes";

describe("PortfolioView", () => {
  beforeAll(() => {
    // jsdom has no layout, so scrolling is not implemented.
    Element.prototype.scrollIntoView = jest.fn();
  });

  it("opens on the works tab", () => {
    render(<PortfolioView portfolio={mockPublicPortfolio} />);

    expect(screen.getByRole("button", { name: "works" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("button", { name: "about me" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("switches to the about tab", () => {
    render(<PortfolioView portfolio={mockPublicPortfolio} />);

    fireEvent.click(screen.getByRole("button", { name: "about me" }));

    expect(screen.getByRole("button", { name: "about me" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("button", { name: "works" })).not.toHaveAttribute(
      "aria-current"
    );
  });

  it("scrolls to the footer when contact is clicked", () => {
    render(<PortfolioView portfolio={mockPublicPortfolio} />);

    fireEvent.click(screen.getByRole("button", { name: "contact" }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it("shows the student's location and contact links", () => {
    render(<PortfolioView portfolio={mockPublicPortfolio} />);
    const { profile, contact } = mockPublicPortfolio.content;

    expect(screen.getByText(profile.location)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "E-MAIL" })).toHaveAttribute(
      "href",
      `mailto:${contact.email}`
    );
    expect(screen.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
  });

  it("hides contact links the student has not filled in", () => {
    const withoutLinks: PublicPortfolio = {
      content: { ...mockPublicPortfolio.content, contact: {} },
    };

    render(<PortfolioView portfolio={withoutLinks} />);

    expect(screen.queryByRole("link", { name: "E-MAIL" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "LinkedIn" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
  });
});
