"use client";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const breakpoint = "840px";

const NavbarButton = styled(Link)<{ $active: boolean }>`
  text-align: center;
  text-decoration: none;
  background-color: ${({ $active }) =>
    $active ? "var(--primary-black-100)" : "transparent"};
  color: ${({ $active }) =>
    $active ? "var(--primary-white)" : "var(--primary-black-100)"};
  transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
`;

/** The surface both navs share: a solid panel, not a hairline over the page. */
const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: hidden;
  padding: 8px;
  background: var(--primary-white);
  border: 1px solid var(--primary-black-10);
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
`;

/**
 * A rail of icons that slides open on hover.
 *
 * Absolutely positioned inside NavigationContainer so the expanded panel floats
 * over the page — the grid track stays at --nav-collapsed, so opening the nav
 * never reflows what the student is reading.
 *
 * Opens on :has(:focus-visible) rather than :focus-within so tabbing through the
 * links still works, without a mouse click pinning the panel open: a clicked
 * link keeps focus across the client-side navigation, and :focus-within would
 * hold the panel out until something else was clicked.
 */
export const DesktopNav = styled(Nav)`
  display: none;

  @media (min-width: ${breakpoint}) {
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--z-nav);
    width: var(--nav-collapsed);
    gap: 8px;
    align-items: flex-start;
    transition: width 0.25s ease, box-shadow 0.25s ease;

    &:hover,
    &:has(:focus-visible) {
      width: var(--nav-expanded);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }
  }
`;

export const DesktopNavbarButton = styled(NavbarButton)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  /* Sized to the panel, so the row grows with it while the icon stays put.
     The 8px inset centres the icon in the collapsed rail: 8 (nav) + 8 (button)
     on each side of a 40px icon is exactly --nav-collapsed. */
  width: 100%;
  padding: 0 8px;
  min-height: 40px;
  font-size: var(--text-base);
  border-radius: var(--radius-md);
  cursor: pointer;

  &:hover {
    background-color: ${({ $active }) =>
      $active ? "var(--primary-black-100)" : "var(--primary-black-5)"};
  }
`;

/**
 * Clipped rather than removed while the rail is collapsed: the text stays in
 * the accessibility tree and in the tab order, it just has nowhere to show.
 */
export const NavLabel = styled.span`
  white-space: nowrap;
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.25s ease;

  ${DesktopNav}:hover &,
  ${DesktopNav}:has(:focus-visible) & {
    opacity: 1;
    transform: translateX(0);
  }
`;

export const Icon = styled(Image)<{ $active: boolean }>`
  flex-shrink: 0;
  filter: ${({ $active }) => ($active ? "brightness(0) invert(1)" : "none")};
`;

export const MobileNav = styled(Nav)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;

  @media (min-width: ${breakpoint}) {
    display: none;
  }
`;

export const MobileNavbarButton = styled(NavbarButton)`
  width: 40px;
  height: 40px;
  display: flex;
  border-radius: var(--radius-md);
  cursor: pointer;
`;
