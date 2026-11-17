"use client";

import Image from "next/image";
import logoSvg from "../../../assets/logoFilled.svg";
import type { PublicPortfolio } from "types/portfolioTypes";
import {
  CvLink,
  Location,
  Container,
  HeaderBar,
  HeaderRow,
  LogoWrap,
  MetaRow,
  Tab,
  Tabs,
} from "./Style";

export type PortfolioTab = "work" | "about";

type Props = {
  portfolio: PublicPortfolio;
  activeTab: PortfolioTab;
  onTabChange: (tab: PortfolioTab) => void;
  onContactClick: () => void;
};

export const Header = ({
  portfolio,
  activeTab,
  onTabChange,
  onContactClick,
}: Props) => {
  const { profile } = portfolio.content;
  // TODO: use portfolio.content.contact.cvUrl once it is added to the types (#16).
  const cvUrl = "#";

  return (
    <HeaderBar>
      <Container>
        <HeaderRow>
          <LogoWrap>
            <Image src={logoSvg} alt="Vefskólinn"/>
          </LogoWrap>
          <Tabs aria-label="Portfolio sections">
            <Tab
              type="button"
              $active={activeTab === "work"}
              aria-current={activeTab === "work" ? "page" : undefined}
              onClick={() => onTabChange("work")}
            >
              works
            </Tab>
            <Tab
              type="button"
              $active={activeTab === "about"}
              aria-current={activeTab === "about" ? "page" : undefined}
              onClick={() => onTabChange("about")}
            >
              about me
            </Tab>
            <Tab type="button" $active={false} onClick={onContactClick}>
              contact
            </Tab>
          </Tabs>
        </HeaderRow>
        <MetaRow>
          <Location>{profile.location}</Location>
          {cvUrl && (
            <CvLink href={cvUrl} target="_blank" rel="noopener noreferrer">
              download CV
            </CvLink>
          )}
        </MetaRow>
      </Container>
    </HeaderBar>
  );
};
