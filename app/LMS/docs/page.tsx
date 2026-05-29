import type { Metadata } from "next";
import { DocsContainer, PageTitle, PageSubtitle } from "./style";
import { CardsGrid } from "./slideshowStyle";
import { HowGradingWorksCard } from "./HowGradingWorksCard";

export const metadata: Metadata = {
  title: "Help & Docs | Vefskólinn LMS",
  description: "Guides to how things work at Vefskólinn.",
};

const DocsPage = () => {
  return (
    <DocsContainer>
      <PageTitle>Help &amp; Docs</PageTitle>
      <PageSubtitle>
        Guides to how things work at Vefskólinn. Pick a topic to get started.
      </PageSubtitle>

      <CardsGrid>
        <HowGradingWorksCard />
      </CardsGrid>
    </DocsContainer>
  );
};

export default DocsPage;
