"use client";
import Image from "next/image";
import Link from "next/link";
import {
  NavStyle,
  NavBackground,
  TextStyle,
  LinkStyle,
  Icon,
  LogOutButton,
} from "./style";
import { signOut } from "serverActions/signOut";

import Logo from "../../../public/LOGO-navbar.svg";
import Home from "../../../public/icons/home.svg";
import Guide from "../../../public/icons/guides.svg";
import Schedule from "../../../public/icons/schedule.svg";
import HallOfFame from "../../../public/icons/H_O_F.svg";
import Resources from "../../../public/icons/resources.svg";
import LogOut from "../../../public/icons/logOut.svg";

const Nav = () => {
  const navbarList = [
    {
      icon: Home,
      text: "Home",
      link: "/",
    },
    {
      icon: Guide,
      text: "Guides",
      link: "/guides",
    },
    {
      icon: Schedule,
      text: "Schedule",
      link: "/schedule" /* Schedule dont exists in pages */,
    },
    {
      icon: HallOfFame,
      text: "Hall of Fame",
      link: "/hallOfFame" /* H O F dont exists in pages */,
    },
    {
      icon: Resources,
      text: "Resources",
      link: "/resources",
    },
  ];
  return (
    <NavBackground>
      <Image src={Logo} alt="vefskolinn-logo" />

      <NavStyle>
        {navbarList.map((list, index) => {
          return (
            <LinkStyle key={index} href={list.link}>
              <Icon src={list.icon} alt="icons"></Icon>
              <TextStyle>{list.text}</TextStyle>
            </LinkStyle>
          );
        })}
      </NavStyle>

      <LogOutButton
        src={LogOut}
        alt="logout"
        onClick={async () => await signOut()}
      />
    </NavBackground>
  );
};

export default Nav;
