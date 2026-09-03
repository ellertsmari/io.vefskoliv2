import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "../../../auth";
import { DocsContainer, PageTitle, PageSubtitle } from "./style";
import { CardsGrid } from "./slideshowStyle";
import { HowGradingWorksCard } from "./HowGradingWorksCard";

export const metadata: Metadata = {
  title: "Help & Docs | Vefskólinn LMS",
  description: "Guides to how things work at Vefskólinn.",
};

const DocsPage = async () => {
  // The proxy already redirects anonymous visitors; this is the page's own
  // check so a matcher change cannot expose it.
  const session = await auth();
  if (!session?.user) redirect("/signin");

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
