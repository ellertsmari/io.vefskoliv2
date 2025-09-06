"use client";
import { MobileNavbarButton, MobileNav ,Icon} from "./style";
import { NavBarProps } from "./NavBar";
import { usePathname } from "next/navigation";

export const MobileNavbar = ({ links }: NavBarProps) => {
  const pathname = usePathname()
  const buttons = links.map((link) => {
    const currentPage = pathname === link.page
    return (
      <MobileNavbarButton $active={currentPage} key={link.page} href={link.page}>
        <Icon $active={currentPage} width={40} height={40} src={link.icon} alt="Navigation icon"/>
      </MobileNavbarButton>
    );
  });

  return <MobileNav>{buttons}</MobileNav>;
};
