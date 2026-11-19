"use client";

import { useState } from "react";
import type { PublicPortfolio } from "types/portfolioTypes";
import { Header, type PortfolioTab } from "./Header";
import { Container, Main, Page, SectionPlaceholder } from "./Style";
import { Hero } from "./Hero";
import { Works } from "./Works";
import { Footer } from "./Footer";
import { portfolioMono, portfolioSans, portfolioSerif } from "./fonts";

type Props = {
  portfolio: PublicPortfolio;
};

export const PortfolioView = ({ portfolio }: Props) => {
  const [activeTab, setActiveTab] = useState<PortfolioTab>("work");
  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Page
      className={`${portfolioMono.variable} ${portfolioSans.variable} ${portfolioSerif.variable}`}
    >
      <Header
        portfolio={portfolio}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onContactClick={scrollToContact}
      />
      <Main>
        <Container>
          <Hero
            profile={portfolio.content.profile}
            availability={portfolio.content.availability}
          />
          {activeTab === "work" ? (
            <Works projects={portfolio.content.projects} />
          ) : (
            <SectionPlaceholder>About</SectionPlaceholder>
          )}
        </Container>
      </Main>
      <Footer portfolio={portfolio} />
    </Page>
  );
};