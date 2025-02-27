import frame1 from "../../public/Frame1.svg";
import Image from "next/image";
import { Poppins } from "next/font/google";
import "globalStyles/globals.css";
import StyledComponentsRegistry from "utils/registry";
import Navbar from "components/navbar/navbar";
import Sidebar from "components/sidebar/sidebar";
import {
  LayoutGrid,
  Main,
  NavbarContainer,
  SidebarContainer,
} from "globalStyles/gridtemplate";

const Landingpage = () => {
  return (
    <div
      style={{
        gridArea: "main",
        backgroundColor: "white",
        minHeight: "100dvh",
        height: "100%",
      }}
    >
      <Image
        alt="background"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
        src={frame1}
      ></Image>
    </div>
  );
};

export default Landingpage;
