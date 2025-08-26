"use client"
import { NavBarProps } from "./NavBar";
import { DesktopNav, DesktopNavbarButton, Icon} from "./style";
import { usePathname } from "next/navigation";

export const DesktopNavbar = ({ links }: NavBarProps) => {
  const pathname = usePathname()
  const buttons = links.map((link) => {
    const currentPage = pathname === link.page
    return (
      <DesktopNavbarButton $active={currentPage} key={link.page} href={link.page}>
      <Icon $active={currentPage} width={40} height={40} src={link.icon} alt="Navigation icon"/>
        {link.title}
      </DesktopNavbarButton>
    );
  });
  return <DesktopNav>{buttons}</DesktopNav>;
};
