"use client";
import styled, { css } from "styled-components";

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
