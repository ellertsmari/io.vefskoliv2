import { DesktopNavbar } from "./DesktopNav";
import { MobileNavbar } from "./MobileNav";

type Link = { page: string; title: string };
export type NavBarProps = { links: Link[] };

const links: Link[] = [
  // { href: "/", label: "HOME" },
  { page: "/guides", title: "GUIDES" },
  // { href: "/resources", label: "RESOURCES" },
  // { href: "/halloffame", label: "H O F" },
  { page: "/people", title: "PEOPLE" },
  // { href: "/calendar", label: "CALENDAR" },
];

export const NavBar = () => {
  return (
    <>
      <DesktopNavbar links={links} />
      <MobileNavbar links={links} />
    </>
  );
};
