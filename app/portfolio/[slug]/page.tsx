import { PortfolioView } from "app/components/portfolio/view/PortfolioView";
import { mockPublicPortfolio } from "utils/portfolio/mockPortfolio";

// Shows the mock portfolio for every slug for now. #29 replaces it with the
// student's published portfolio from getPublicPortfolio.
export default function PublicPortfolioPage() {
  return <PortfolioView portfolio={mockPublicPortfolio} />;
}
