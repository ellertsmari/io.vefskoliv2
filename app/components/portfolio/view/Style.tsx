"use client";
import styled, { css } from "styled-components";
import { GalleryItemImage } from "app/components/gallery/styles";

/* Shared look of the public portfolio page. Fonts and colours come from the
   app's global CSS variables; the three themes are added later (#28). */

const BREAKPOINT = "768px";
const CV_WIDTH = "144px";
const LOGO_TEXT_OFFSET = "50px";

export const Page = styled.div`
  --portfolio-accent: #e8622a;
  min-height: 100%;
  background: var(--primary-white);
  color: var(--primary-black-100);
  display: flex;
  flex-direction: column;
`;

export const Container = styled.div`
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  /* 16px on phones, growing to 32px: the same edge spacing as the LMS pages. */
  padding: 0 clamp(16px, 2vw, 32px);
`;

/* ---------- Header ---------- */

export const HeaderBar = styled.header`
  padding-top: 24px;
`;

export const HeaderRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  position: relative;
  gap: 16px;

  /* The header line starts after the logo mark, not under it. */
  &::after {
    content: "";
    position: absolute;
    left: ${LOGO_TEXT_OFFSET};
    right: 0;
    bottom: 0;
    /* A border, not a 1.5px-high background: browsers round borders the same
       way as the tab outlines, so the line matches their thickness. */
    border-bottom: 1.5px solid var(--primary-black-100);
  }

  @media (max-width: ${BREAKPOINT}) {
    &::after {
      left: 0;
    }
  }
`;

export const LogoWrap = styled.div`
  padding-bottom: 12px;
  display: flex;
  align-items: center;
  margin-bottom: -24px; /* the header line runs through the middle of the logo */

  @media (max-width: ${BREAKPOINT}) {
    margin-bottom: 0; /* the logo sits on its own row above the tabs */
  }
`;

export const Tabs = styled.nav`
  display: flex;
  margin-right: ${CV_WIDTH}; /* the CV button hangs in this gap, below the line */

  @media (max-width: ${BREAKPOINT}) {
    margin-right: 0;
    width: 100%;
  }
`;

/* Folder-style tabs: the active tab is filled black, the others white. */
export const Tab = styled.button<{ $active: boolean }>`
  min-height: 32px;
  min-width: ${CV_WIDTH};
  padding: 0 24px;
  border: 1.5px solid var(--primary-black-100);
  border-radius: 26px 26px 0 0;
  font: inherit;
  font-family: var(--portfolio-mono), monospace;
  font-size: var(--text-sm);
  letter-spacing: 0.02em;
  cursor: pointer;
  background: var(--primary-white);
  color: var(--primary-black-100);

  position: relative;

  & + & {
    margin-left: -1.5px; /* neighbouring tabs share one border line */
  }

  ${({ $active }) =>
    $active &&
    css`
      z-index: 1; /* the active tab's full outline sits above its neighbours */
      background: var(--primary-black-100);
      color: var(--primary-white);
    `}

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }

  @media (max-width: ${BREAKPOINT}) {
    flex: 1; /* three equal tabs across the screen */
    min-width: 0;
    padding: 0 14px;
  }
`;

export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
`;

export const Location = styled.span`
  padding-top: 10px;
  padding-left: ${LOGO_TEXT_OFFSET};
  font-size: var(--text-xs);
  font-family: var(--portfolio-mono), monospace;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-black-60);

  @media (max-width: ${BREAKPOINT}) {
    padding-left: 0;
  }
`;

/* Hangs below the header line; its colour is the student's accent colour. */
export const CvLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  min-width: ${CV_WIDTH};
  padding: 0 24px;
  margin-left: auto;
  border-radius: 0 0 26px 26px;
  background: var(--portfolio-accent);
  color: var(--primary-black-100);
  font-size: var(--text-sm);
  font-family: var(--portfolio-mono), monospace;
  text-decoration: none;
  letter-spacing: 0.02em;

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 2px;
  }

  @media (max-width: ${BREAKPOINT}) {
    min-width: 0;
    width: calc(100% / 3); /* same width as the contact tab above it */
    padding: 0 8px;
    font-size: var(--text-xs);
    white-space: nowrap; /* "download CV" stays on one line */
  }
`;

/* ---------- Main ---------- */

export const Main = styled.main`
  flex: 1;
  padding: 64px 0 96px;
`;

/* Placeholder until the real sections arrive (#25 Hero, #26 Works, #27 About). */
export const SectionPlaceholder = styled.section`
  border: 1.5px dashed var(--primary-black-30);
  border-radius: var(--radius-lg);
  padding: 40px 24px;
  color: var(--primary-black-60);
  text-align: center;
`;

/* ---------- Hero ---------- */

export const HeroSection = styled.section`
  margin-bottom: 48px;
`;

export const HeroName = styled.h1`
  margin: 0;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.04em;
  overflow-wrap: anywhere; /* a very long name wraps instead of widening the page */
`;

/* Still real text, so screen readers and search engines read it. */
export const NameOutline = styled.span`
  @supports (-webkit-text-stroke: 1px black) {
    color: transparent;
    -webkit-text-stroke: 1.5px var(--primary-black-100);
  }
`;

export const HeroLines = styled.p`
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap; /* on phones the tagline moves to its own line */
  align-items: baseline;
  column-gap: 16px;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: clamp(1.5rem, 3.5vw, 2.5rem);
  line-height: 1.15;
`;

export const Headline = styled.span`
  font-weight: 700;
`;

export const Tagline = styled.span`
  font-family: var(--portfolio-serif), serif;
  letter-spacing: 0.02em;
`;

/* ---------- Works ---------- */

export const WorksSection = styled.section`
  margin-top: 48px;
`;

export const WorksHeading = styled.h2`
  margin: 0 0 24px;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: var(--text-lg);
  font-weight: 600;
`;

/* Two cards per row, as in Figma. The Gallery's grid keeps adding columns
   on a wide screen, so it is not reused here; the cards themselves are. */
export const WorksGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;

  @media (max-width: ${BREAKPOINT}) {
    grid-template-columns: 1fr; /* one card per row on phones */
  }
`;

/* The Gallery image box has a fixed height, which looks flat in a wide
   two-column card. Here it keeps the 3:2 shape from Figma at any width. */
export const ProjectImage = styled(GalleryItemImage)`
  height: auto;
  aspect-ratio: 3 / 2;

  @media (min-width: 768px) {
    height: auto;
  }
`;

/* Shown when a project has no image: neutral, like the photo frame in Figma,
   so it doesn't clash with the student's accent colour. */
export const ProjectPlaceholder = styled(ProjectImage)`
  background: var(--primary-black-5);
  color: var(--primary-black-60);
  font-family: var(--portfolio-mono), monospace;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

/* The full text of a long project description, shown over the cut one.
   It grows upwards over the image, so the card (overflow: hidden) never
   clips it. Hidden only visually: screen readers always read it. */
export const DescriptionPopover = styled.span`
  position: absolute;
  left: -10px;
  right: -10px;
  bottom: -10px;
  z-index: 2;
  padding: 10px;
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-md);
  background: var(--primary-white);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  color: var(--primary-black-100);
  font-family: "Source Sans 3", sans-serif;
  font-size: var(--text-sm);
  line-height: 1.5;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
`;

/* Wraps a long description: hover, keyboard focus or a tap shows the popover. */
export const DescriptionHover = styled.div`
  position: relative;
  flex: 1;
  cursor: default;

  &:hover ${DescriptionPopover},
  &:focus ${DescriptionPopover} {
    opacity: 1;
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-100);
    outline-offset: 4px;
    border-radius: 4px;
  }
`;

/* ---------- Footer ---------- */

export const FooterBar = styled.footer`
  background: var(--primary-black-100);
  color: var(--primary-white);
  padding: 80px 0 24px;
`;

export const FooterHeading = styled.h2`
  margin: 0 0 24px;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.05;
  font-weight: 700;
`;

export const FooterLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;

  /* The white fill follows the pointer: while any link is hovered,
     the others (including E-MAIL) go back to the outline style. */
  @media (hover: hover) {
    &:hover > a:not(:hover) {
      background: transparent;
      color: var(--primary-white);
    }
  }
`;

export const FooterLink = styled.a<{ $primary?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  min-width: 160px;
  padding: 0 24px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--primary-white);
  color: var(--primary-white);
  text-decoration: none;
  font-size: var(--text-sm);
  font-family: var(--portfolio-mono), monospace;
  letter-spacing: 0.04em;
  transition: background 0.2s, color 0.2s;

  ${({ $primary }) =>
    $primary &&
    css`
      background: var(--primary-white);
      color: var(--primary-black-100);
    `}

  @media (hover: hover) {
    &:hover {
      background: var(--primary-white);
      color: var(--primary-black-100);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--theme-module3-60);
    outline-offset: 2px;
  }
`;

export const FooterBottom = styled.div`
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--primary-black-60);
  font-size: var(--text-xs);
  font-family: var(--portfolio-mono), monospace;
  color: var(--primary-black-30);
`;
