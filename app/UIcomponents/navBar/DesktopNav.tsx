import { DesktopNav, DesktopNavbarButton } from "./style";

export const DesktopNavbar = () => {
  const links = [
    { href: "/", label: "HOME" },
    { href: "/guides", label: "GUIDES" },
    { href: "/resources", label: "RESOURCES" },
    { href: "/halloffame", label: "H O F" },
    { href: "/people", label: "PEOPLE" },
    { href: "/calendar", label: "CALENDAR" },
  ];

  const buttons = links.map((link, index) => {
    return (
      <DesktopNavbarButton key={index} href={link.href}>
        {link.label}
      </DesktopNavbarButton>
    );
  });
  return <DesktopNav>{buttons}</DesktopNav>;
};
