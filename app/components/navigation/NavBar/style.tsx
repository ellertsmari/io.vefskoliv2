"use client";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const breakpoint = "840px";

export const NavbarButton = styled(Link)<{$active: boolean}>`
  width: 100%;
  text-align: center;
  text-decoration: none;
  background-color: ${({$active}) => ($active ? "black" : "none")};
  color: ${({$active}) => ($active ? "white" : "black")};
  transition: 0.3s ease-in-out;
`;

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  overflow: hidden;
  border-radius: 8px;
  padding: 8px;
`;

export const DesktopNav = styled(Nav)`
  display: none;
  @media (min-width: ${breakpoint}) {
    flex-direction: column;
    display: flex;
    gap: 16px;
    border: 1px solid var(--primary-black-30);
  }
`;

export const DesktopNavbarButton = styled(NavbarButton)`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  width: 138px;
  font-size: 15px;
  border-radius: 8px;
  cursor: pointer;

  &:hover{
    background-color: lightgray;
  }
`;

export const Icon = styled(Image)<{$active: boolean}>`
  filter: ${({$active}) => ($active ? "brightness(0) invert(1)" : "none")};
`

export const MobileNav = styled(Nav)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid var(--primary-black-30);
 @media (min-width: ${breakpoint}){
  display: none;
 }
`;

export const MobileNavbarButton = styled(NavbarButton)`
    width: 40px;
    height: 40px;
    display: flex;
    border-radius: 8px;
    cursor: pointer;
`;