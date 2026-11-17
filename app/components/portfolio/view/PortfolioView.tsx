"use client";

import { useState } from "react";
import type { PublicPortfolio } from "types/portfolioTypes";
import { Header, type PortfolioTab } from "./Header";
import { Container, Main, Page, SectionPlaceholder } from "./Style";
import { Footer } from "./Footer";
import { portfolioMono } from "./fonts";

type Props = {
  portfolio: PublicPortfolio;
};

export const PortfolioView = ({ portfolio }: Props) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>("work");
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Page className={portfolioMono.variable}>
      <Header
        portfolio={portfolio}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onContactClick={scrollToContact}
      />
      <Main>
        <Container>
          <SectionPlaceholder>
            {activeTab === "work" ? "Works" : "About"}
          </SectionPlaceholder>
        </Container>
      </Main>
      <Footer portfolio={portfolio} />
    </Page>
  );
};