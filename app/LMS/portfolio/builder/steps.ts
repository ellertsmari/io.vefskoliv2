// Issue #31: the four steps shared by the builder navigation and editor.
// Step components will be implemented in their respective issues.
export const PORTFOLIO_STEPS = [
  { id: "profile", label: "Profile" },
  { id: "projects", label: "Projects" },
  { id: "theme", label: "Theme" },
  { id: "contact", label: "Contact" },
] as const;

export type PortfolioStepId = (typeof PORTFOLIO_STEPS)[number]["id"];
