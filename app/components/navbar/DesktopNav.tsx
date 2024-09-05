import { DesktopNav, DesktopNavbarButton } from "./style";

export const DesktopNavbar = () => {
  const links = [
    { href: "/", label: "HOME" },
    { href: "/guides", label: "GUIDES" },
    { href: "/resources", label: "RESOURCES" },
    { href: "/halloffame", label: "HALL OF FAME" },
    { href: "/people", label: "PEOPLE" },
    { href: "/calendar", label: "CALENDAR" },
  ];

  const buttons = links.map((link, index) => {
    return (
      <DesktopNavbarButton href={link.href}>{link.label}</DesktopNavbarButton>
    );
  });
  console.log(buttons);
  return <DesktopNav>{buttons}</DesktopNav>;
};
