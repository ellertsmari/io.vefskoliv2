"use client"
import { NavBarProps } from "./NavBar";
import { DesktopNav, DesktopNavbarButton, Icon, NavLabel } from "./style";
import { usePathname } from "next/navigation";

export const DesktopNavbar = ({ links }: NavBarProps) => {
  const pathname = usePathname()
  const buttons = links.map((link) => {
    const currentPage = pathname === link.page
    return (
      <DesktopNavbarButton
        $active={currentPage}
        key={link.page}
        href={link.page}
        aria-current={currentPage ? "page" : undefined}
      >
        {/* Decorative: the label beside it already names the destination. */}
        <Icon $active={currentPage} width={40} height={40} src={link.icon} alt="" />
        <NavLabel>{link.title}</NavLabel>
      </DesktopNavbarButton>
    );
  });
  return <DesktopNav>{buttons}</DesktopNav>;
};
