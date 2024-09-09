"use client";
import { useState } from "react";
import { NavbarButton, MobileNav, OpenTrayButton } from "./style";

export const MobileNavbar = () => {
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

  const handleOpenNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return isNavOpen ? (
    <MobileNav style={{ border: "solid 1px var(--theme-module3-100)" }}>
      <OpenTrayButton onClick={handleOpenNav} $opened>
        CLOSE NAVIGATION
      </OpenTrayButton>

      <NavbarButton href="/">HOME</NavbarButton>
      <NavbarButton href="/guides">GUIDES</NavbarButton>
      <NavbarButton href="/resources">RESOURCES</NavbarButton>
      <NavbarButton href="/halloffame">HALL OF FAME</NavbarButton>
      <NavbarButton href="/people">PEOPLE</NavbarButton>
      <NavbarButton href="/calendar">CALENDAR</NavbarButton>
    </MobileNav>
  ) : (
    <MobileNav>
      <OpenTrayButton onClick={handleOpenNav}>OPEN NAVIGATION</OpenTrayButton>
    </MobileNav>
  );
};
