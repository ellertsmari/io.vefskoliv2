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

/* ---------- Hero ---------- */

export const HeroSection = styled.section<{ $withPhoto?: boolean }>`
  margin-bottom: 48px;

  /* On the about tab the photo sits to the right of the name;
     on phones it moves under the text. */
  ${({ $withPhoto }) =>
    $withPhoto &&
    css`
      @media (min-width: ${BREAKPOINT}) {
        display: grid;
        grid-template-columns: 1fr minmax(200px, 320px);
        gap: 32px;
        align-items: center;
      }
    `}
`;

export const HeroText = styled.div`
  min-width: 0; /* lets a long name wrap inside the grid column */

  /* On phones the headline and the tagline share a line and the badge goes
     under them. The row around the badge and the tagline steps aside (see
     HeroRow), the badge is moved to the end, and an empty full-width item
     before it starts a new line. */
  @media (max-width: ${BREAKPOINT}) {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 16px;

    & > h1 {
      flex-basis: 100%;
    }

    &::after {
      content: "";
      flex-basis: 100%;
      order: 1;
    }
  }
`;

export const HeroPhoto = styled.div`
  margin-top: 24px;
  aspect-ratio: 1 / 1; /* the builder asks for square photos */
  border-radius: var(--radius-lg);
  overflow: hidden;

  @media (min-width: ${BREAKPOINT}) {
    margin-top: 0;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

/* Neutral, like the project image placeholder. */
export const HeroPhotoPlaceholder = styled(HeroPhoto)`
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-black-5);
  color: var(--primary-black-60);
  font-family: var(--portfolio-mono), monospace;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
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

/* On phones the tagline sits on the right, so the two lines form a step. */
const taglineRightOnPhones = css`
  @media (max-width: ${BREAKPOINT}) {
    margin-left: auto;
  }
`;

/* Shown only while the student is open to an internship. */
export const Availability = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 0;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--accent-green-10);
  color: var(--accent-green-text);
  font-family: var(--portfolio-mono), monospace;
  font-size: var(--text-xs);
`;

export const AvailabilityDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-green-100);
`;

/* The headline gets its own line; the badge and the tagline share the next
   one (on phones see HeroText). */
export const Headline = styled.p`
  margin: 8px 0 0;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: clamp(1.5rem, 3.5vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
`;

export const HeroRow = styled.div`
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 24px;

  ${Availability} {
    margin: 0; /* the row already gives the spacing */
  }

  @media (max-width: ${BREAKPOINT}) {
    display: contents; /* the badge and the tagline join the text around them */

    ${Availability} {
      order: 2;
      margin-top: 16px;
    }
  }
`;

export const Tagline = styled.p`
  margin: 0;
  font-family: var(--portfolio-serif), serif;
  font-size: clamp(1.5rem, 3.5vw, 2.5rem);
  line-height: 1.15;
  letter-spacing: 0.02em;
  ${taglineRightOnPhones}
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

/* The number of columns depends on how many projects there are (see
   Works.tsx). The Gallery's grid keeps adding columns on a wide screen, so it
   is not reused here; the cards themselves are. */
export const WorksGrid = styled.div<{ $columns: 1 | 2 | 3 }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: 24px;

  /* A single project: one wide card with the image on the left. */
  ${({ $columns }) =>
    $columns === 1 &&
    css`
      @media (min-width: ${BREAKPOINT}) {
        & > * {
          flex-direction: row;
        }

        & > * > :first-child {
          flex: none;
          width: 50%;
        }
      }
    `}

  /* Three columns get too narrow on a tablet. */
  ${({ $columns }) =>
    $columns === 3 &&
    css`
      @media (max-width: 1100px) {
        grid-template-columns: repeat(2, 1fr);
      }
    `}

  @media (max-width: ${BREAKPOINT}) {
    grid-template-columns: 1fr; /* one card per row on phones */
  }
`;

/* The Gallery image box has a fixed height, which looks flat in a wide
   two-column card. Here it keeps a 16:10 shape at any width. */
export const ProjectImage = styled(GalleryItemImage)`
  height: auto;
  aspect-ratio: 16 / 10;

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

/* ---------- About ---------- */

export const AboutSection = styled.section`
  margin-bottom: 48px;
`;

export const AboutHeading = styled.h2`
  margin: 0 0 16px;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: var(--text-2xl);
  font-weight: 700;
  letter-spacing: 0.06em;
`;

export const AboutText = styled.div`
  max-width: 65ch; /* comfortable line length for reading */
  font-family: var(--portfolio-sans), sans-serif;
  font-size: var(--text-base);
  line-height: 1.6;

  p {
    margin: 0 0 1em;
  }

  p:last-child {
    margin-bottom: 0;
  }
`;

/* One row of facts between two lines; 2 × 2 on phones. */
export const Facts = styled.dl`
  margin: 0 0 48px;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  border-top: 1.5px solid var(--primary-black-100);
  border-bottom: 1.5px solid var(--primary-black-100);

  @media (max-width: ${BREAKPOINT}) {
    grid-auto-flow: row;
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const Fact = styled.div`
  padding: 20px 16px 20px 0;

  & + & {
    padding-left: 20px;
    border-left: 1px solid var(--primary-black-10);
  }

  @media (max-width: ${BREAKPOINT}) {
    padding: 12px 8px 12px 0;

    & + & {
      padding-left: 0;
      border-left: none;
    }
  }
`;

export const FactLabel = styled.dt`
  margin: 0 0 6px;
  color: var(--primary-black-60);
  font-family: var(--portfolio-mono), monospace;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const FactValue = styled.dd`
  margin: 0;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: var(--text-base);
  font-weight: 700;
`;

export const SkillsHeading = styled.h2`
  margin: 0 0 24px;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: var(--text-2xl);
  font-weight: 600;
`;

export const SkillGroups = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px 48px;
`;

export const SkillCard = styled.div`
  padding: 20px;
  border: 1.5px solid var(--primary-black-100);
  border-radius: var(--radius-lg);
`;

/* Styled like the facts row: a small grey label, the skills big and bold,
   because the skills are what a recruiter looks for. */
export const SkillCardTitle = styled.h3`
  margin: 0 0 8px;
  color: var(--primary-black-60);
  font-family: var(--portfolio-mono), monospace;
  font-size: var(--text-xs);
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const SkillCardList = styled.p`
  margin: 0;
  font-family: var(--portfolio-sans), sans-serif;
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.5;
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
