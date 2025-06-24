"use client";
import { MobileNavbarButton, MobileNav } from "./style";
import { NavBarProps } from "./NavBar";
import Image from "next/image";

export const MobileNavbar = ({ links }: NavBarProps) => {
  const buttons = links.map((link, index) => {
    return (
      <MobileNavbarButton key={index} href={link.page}>
        <Image width={40} height={40} src={link.icon} alt="Navigation icon"/>
      </MobileNavbarButton>
    );
  });

  return <MobileNav>{buttons}</MobileNav>;
};
