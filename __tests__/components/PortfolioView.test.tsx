/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    expect(screen.getByRole("link", { name: "download CV" })).toHaveAttribute(
      "href",
      contact.cvUrl
    );

    // Project cards have GitHub links too, so look inside the footer only.
    const footer = within(screen.getByRole("contentinfo"));
    expect(footer.getByRole("link", { name: "E-MAIL" })).toHaveAttribute(
      "href",
      `mailto:${contact.email}`
    );
    expect(footer.getByRole("link", { name: "LinkedIn" })).toBeInTheDocument();
    expect(footer.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(footer.getByRole("link", { name: "CV" })).toHaveAttribute("href", contact.cvUrl);
  });

  it("hides contact links the student has not filled in", () => {
    const withoutLinks: PublicPortfolio = {
      content: { ...mockPublicPortfolio.content, contact: {} },
    };

    render(<PortfolioView portfolio={withoutLinks} />);

    expect(screen.queryByRole("link", { name: "download CV" })).not.toBeInTheDocument();
    // Project cards keep their own GitHub links; the footer has none left.
    expect(within(screen.getByRole("contentinfo")).queryAllByRole("link")).toHaveLength(0);
  });

  it("outlines only the last word of the name", () => {
    const portfolio: PublicPortfolio = {
      content: {
        ...mockPublicPortfolio.content,
        profile: { ...mockPublicPortfolio.content.profile, name: "Anna María Jónsdóttir" },
      },
    };

    render(<PortfolioView portfolio={portfolio} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Anna María Jónsdóttir");
    // The outlined word is its own element; the rest is plain text in the h1.
    expect(screen.getByText("Jónsdóttir").tagName).toBe("SPAN");
  });

  it("leaves out the headline line when it is empty", () => {
    const { headline, tagline } = mockPublicPortfolio.content.profile;
    const portfolio: PublicPortfolio = {
      content: {
        ...mockPublicPortfolio.content,
        profile: { ...mockPublicPortfolio.content.profile, headline: "", tagline: "" },
      },
    };

    render(<PortfolioView portfolio={portfolio} />);

    expect(screen.queryByText(headline)).not.toBeInTheDocument();
    expect(screen.queryByText(tagline)).not.toBeInTheDocument();
  });

  it("shows a card for every project", () => {
    render(<PortfolioView portfolio={mockPublicPortfolio} />);

    const titles = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(titles).toEqual(mockPublicPortfolio.content.projects.map((p) => p.title));
  });

  it("shows only the project links the student has filled in", () => {
    const [first] = mockPublicPortfolio.content.projects;
    const portfolio: PublicPortfolio = {
      content: {
        ...mockPublicPortfolio.content,
        projects: [{ ...first, liveUrl: "https://example.com", githubUrl: undefined }],
      },
    };

    render(<PortfolioView portfolio={portfolio} />);

    expect(screen.getByRole("link", { name: /Live page/ })).toHaveAttribute(
      "href",
      "https://example.com"
    );
    // The header and footer have links too, so only count the ones in the works section.
    const works = screen.getByRole("region", { name: /Projects I'm proud of/ });
    expect(within(works).getAllByRole("link")).toHaveLength(1);
  });

  it("shortens a long project description and keeps the full text in a popover", () => {
    const [first] = mockPublicPortfolio.content.projects;
    const longText = `${"A sentence about the project. ".repeat(8)}The end.`;
    const portfolio: PublicPortfolio = {
      content: {
        ...mockPublicPortfolio.content,
        projects: [{ ...first, description: longText }],
      },
    };

    render(<PortfolioView portfolio={portfolio} />);

    // The cut text ends on a whole word, and screen readers skip it.
    const cut = screen.getByText(/…$/);
    expect(cut).toHaveAttribute("aria-hidden", "true");
    expect(cut.textContent).toMatch(/project\.…$/);
    // The full text is in the popover (shown with CSS on hover or focus).
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it("shows three technologies and hides the rest behind +N", () => {
    const [first] = mockPublicPortfolio.content.projects;
    const portfolio: PublicPortfolio = {
      content: {
        ...mockPublicPortfolio.content,
        projects: [{ ...first, technologies: ["HTML", "CSS", "React", "Figma", "Next.js"] }],
      },
    };

    render(<PortfolioView portfolio={portfolio} />);

    expect(screen.getByText("+2")).toHaveAttribute(
      "aria-label",
      "2 more technologies: Figma, Next.js"
    );
  });

  it("leaves out the works section when there are no projects", () => {
    const portfolio: PublicPortfolio = {
      content: { ...mockPublicPortfolio.content, projects: [] },
    };

    render(<PortfolioView portfolio={portfolio} />);

    expect(screen.queryByRole("heading", { name: /Projects I'm proud of/ })).not.toBeInTheDocument();
  });
});
