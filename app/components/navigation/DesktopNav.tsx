import { NavBarProps } from "./NavBar";
import { DesktopNav, DesktopNavbarButton} from "./style";
import Image from "next/image";

export const DesktopNavbar = ({ links }: NavBarProps) => {
  const buttons = links.map((link, index) => {
    return (
      <DesktopNavbarButton key={index} href={link.page}>
      <Image width={40} height={40} src={link.icon} alt="Navigation icon"/>
        {link.title}
      </DesktopNavbarButton>
    );
  });
  return <DesktopNav>{buttons}</DesktopNav>;
};
