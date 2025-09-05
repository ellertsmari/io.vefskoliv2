import { DesktopNavbar } from "./DesktopNav";
import { MobileNavbar } from "./MobileNav";
import HomeIcon from "../../../assets/icons/home.svg"
import GuidesIcon from "../../../assets/icons/guides.svg"
import ResourcesIcon from "../../../assets/icons/resources.svg"
import GalleryIcon from "../../../assets/icons/gallery.svg"
import PeopleIcon from "../../../assets/icons/people.svg"
import CalendarIcon from "../../../assets/icons/calendar.svg"

type Link = { page: string; title: string; icon: string; };
export type NavBarProps = { links: Link[] };

const links: Link[] = [
  { page: "/", title: "HOME", icon: HomeIcon },
  { page: "/guides", title: "GUIDES", icon: GuidesIcon },
  { page: "/LMS/resources", title: "RESOURCES", icon: ResourcesIcon },
  { page: "/halloffame", title: "GALLERY", icon: GalleryIcon },
  { page: "/LMS/people", title: "PEOPLE", icon:PeopleIcon },
  { page: "/LMS/calendar", title: "CALENDAR", icon: CalendarIcon },
];

export const NavBar = () => {
  return (
    <>
      <DesktopNavbar links={links} />
      <MobileNavbar links={links} />
    </>
  );
};
