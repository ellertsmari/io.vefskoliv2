"use client";
import styled from "styled-components";

const breakpoint = "650px";

export const NavbarButton = styled.a`
  width: 100%;
  text-align: center;
  background-color: var(--primary-white);
  color: var(--theme-module3-100);
  font-size: 18px;
  padding: 10px;
  text-decoration: none;

  &:hover {
    background-color: var(--primary-black-10);
  }
`;

export const DesktopNavbarButton = styled(NavbarButton)`
  display: none;
  width: auto;
  @media (min-width: ${breakpoint}) {
    display: block;
    background-color: var(--primary-white);
    border: solid 1px var(--theme-module3-100);
    font-size: 15px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s ease-in-out;
  }
`;

export const Nav = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  align-items: center;
  width: 100%;
  justify-content: space-around;
  overflow: hidden;
  border-radius: 8px;
`;

export const DesktopNav = styled(Nav)`
  display: none;
  @media (min-width: ${breakpoint}) {
    flex-direction: row;
    justify-content: flex-end;
    display: flex;
    gap: 5px;
  }
`;

export const MobileNav = styled(Nav)`
  display: flex;
  @media (min-width: ${breakpoint}) {
    display: none;
  }
`;

export const OpenTrayButton = styled.button<{ $opened?: boolean }>`
  width: 100%;
  padding: 10px;
  background-color: var(--primary-white);

  ${(props) =>
    props.$opened
      ? `
  border: none;
  background-color: var(--theme-module3-100);
  color: var(--primary-white);
  border-radius: 0;
  &:hover {
    background-color: var(--theme-module3-60);
  }
`
      : `
  border: solid 1px var(--theme-module3-100);
  background-color: var(--primary-white);
  color: var(--theme-module3-100);
  border-radius: 8px;
  &:hover {
    background-color: var(--primary-black-10);
  }
`}

  @media (min-width: ${breakpoint}) {
    display: none;
  }
`;
